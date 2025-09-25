use crate::{boot::setup::AppData, error::MyError};
use futures::{AsyncBufReadExt, TryStreamExt};
use k8s_openapi::{
    api::core::v1::Pod,
    chrono::{DateTime, Utc},
};
use kube::{
    api::{Api, AttachParams, LogParams},
    runtime::wait::{await_condition, conditions::is_pod_running},
};

use serde::Deserialize;
use std::sync::Mutex;
use tauri::State;
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    select,
};
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize)]
pub struct PodLogStream {
    namespace: String,
    container: Option<String>,
    tail: Option<i64>,
    follow: bool,
    since: Option<i64>,
    since_time: Option<DateTime<Utc>>,
    timestamps: Option<bool>,
    pod: String,
}

#[tauri::command]
pub async fn log_stream(
    pod_log_stream: PodLogStream,
    client_id: String,
    state: State<'_, Mutex<AppData>>,
) -> Result<(), MyError> {
    let (client, ws_manager) = {
        let app_data = state.lock().unwrap();
        (
            app_data.client.clone().unwrap(),
            app_data.websocket.clone().unwrap(),
        )
    };

    let pods: Api<Pod> = Api::namespaced(client, &pod_log_stream.namespace);
    let logs = pods
        .log_stream(
            &pod_log_stream.pod,
            &LogParams {
                follow: pod_log_stream.follow,
                container: pod_log_stream.container,
                since_seconds: pod_log_stream.since,
                since_time: pod_log_stream.since_time,
                tail_lines: pod_log_stream.tail,
                timestamps: pod_log_stream.timestamps.unwrap_or(false),
                ..LogParams::default()
            },
        )
        .await?;
    let client_id = Uuid::parse_str(&client_id).map_err(|e| MyError::InvalidUuid(e.to_string()))?;

    let mut lines = logs.lines();
    loop {
        match lines.try_next().await {
            std::result::Result::Ok(Some(line)) => {
                // 直接发送日志行给WebSocket客户端
                match ws_manager.send_message(client_id, line).await {
                    std::result::Result::Ok(_) => {}
                    std::result::Result::Err(e) => {
                        eprintln!("Failed to send log message: {}", e);
                        break;
                    }
                }
            }
            std::result::Result::Ok(None) => {
                // 流结束
                break;
            }
            std::result::Result::Err(e) => {
                eprintln!("Error reading log line: {}", e);
                break;
            }
        }
    }

    Ok(())
}

#[derive(Debug, Clone, Deserialize)]
pub struct PodTerminalStream {
    namespace: String,
    name: String,
    container: String,
    command: Vec<String>,
}

#[tauri::command]
pub async fn pod_terminal(
    pod_terminal: PodTerminalStream,
    client_id: String,
    state: State<'_, Mutex<AppData>>,
) -> Result<(), MyError> {
    let (client, ws_manager) = {
        let app_data = state.lock().unwrap();
        (
            app_data.client.clone().unwrap(),
            app_data.websocket.clone().unwrap(),
        )
    };
    let client_id = Uuid::parse_str(&client_id).map_err(|e| MyError::InvalidUuid(e.to_string()))?;

    let pods: Api<Pod> = Api::namespaced(client, &pod_terminal.namespace);

    let _pod = await_condition(pods.clone(), &pod_terminal.name, is_pod_running())
        .await
        .map_err(|e| MyError::KubeError(format!("Pod not ready: {}", e)))?;

    let mut attached = pods
        .exec(
            &pod_terminal.name,
            &pod_terminal.command,
            &AttachParams::default()
                .stdin(true)
                .stderr(false)
                .tty(true)
                .container(&pod_terminal.container),
        )
        .await
        .map_err(|e| {
            println!("Failed to exec into pod: {}", e);
            MyError::KubeError(format!("Failed to exec into pod: {}", e))
        })?;

    let mut stdout = attached
        .stdout()
        .ok_or_else(|| MyError::KubeError("No stdout available".to_string()))?;
    let mut stdin = attached
        .stdin()
        .ok_or_else(|| MyError::KubeError("No stdin available".to_string()))?;

    let (input_tx, mut input_rx) = tokio::sync::mpsc::unbounded_channel::<String>();

    ws_manager.set_terminal_input(client_id, input_tx).await;

    let ws_manager_stdout = ws_manager.clone();
    let stdout_task = tokio::spawn(async move {
        let mut buffer = [0u8; 4096];
        loop {
            match stdout.read(&mut buffer).await {
                std::result::Result::Ok(0) => break, // EOF
                std::result::Result::Ok(n) => {
                    let output = String::from_utf8_lossy(&buffer[..n]);
                    if let std::result::Result::Err(e) = ws_manager_stdout
                        .send_message(client_id, output.to_string())
                        .await
                    {
                        eprintln!("Failed to send stdout: {}", e);
                        break;
                    }
                }
                std::result::Result::Err(e) => {
                    eprintln!("Error reading stdout: {}", e);
                    break;
                }
            }
        }
    });

    let stdin_task = tokio::spawn(async move {
        while let Some(input) = input_rx.recv().await {
            if let std::result::Result::Err(e) = stdin.write_all(input.as_bytes()).await {
                eprintln!("Failed to write to stdin: {}", e);
                break;
            }
            if let std::result::Result::Err(e) = stdin.flush().await {
                eprintln!("Failed to flush stdin: {}", e);
                break;
            }
        }
    });

    select! {
        _ = stdout_task => {
            println!("Stdout task completed for client {}", client_id);
        }
        _ = stdin_task => {
            println!("Stdin task completed for client {}", client_id);
        }
    }

    ws_manager.remove_terminal_input(client_id).await;

    Ok(())
}

// #[derive(Debug, Clone, Deserialize)]
// pub struct TerminalResize {
//     namespace: String,
//     name: String,
//     container: String,
//     rows: u16,
//     cols: u16,
// }

// #[tauri::command]
// pub async fn resize_terminal(
//     resize_params: TerminalResize,
//     state: State<'_, Mutex<AppData>>,
// ) -> Result<(), MyError> {
//     let client = {
//         let app_data = state.lock().unwrap();
//         app_data.client.clone().unwrap()
//     };

//     let _pods: Api<Pod> = Api::namespaced(client, &resize_params.namespace);

//     // 创建终端大小参数
//     let _terminal_size = TerminalSize {
//         height: resize_params.rows,
//         width: resize_params.cols,
//     };

//     // 注意：这个功能需要根据实际的 kube-rs API 调整
//     // 目前 kube-rs 可能不直接支持调整终端大小
//     // 这里提供一个基本框架
//     println!(
//         "Terminal resize requested for pod {}/{} to {}x{}",
//         resize_params.namespace, resize_params.name, resize_params.cols, resize_params.rows
//     );

//     Ok(())
// }
