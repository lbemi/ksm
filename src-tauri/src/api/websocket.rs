use crate::{boot::setup::AppData, error::MyError};
use futures::{AsyncBufReadExt, SinkExt, StreamExt, TryStreamExt};
use k8s_openapi::{
    api::core::v1::Pod,
    chrono::{DateTime, Utc},
};
use kube::{api::LogParams, Api, Client};
use serde::Deserialize;
use std::sync::Mutex;
use tauri::State;
use tokio::net::TcpStream;
use tokio_tungstenite::tungstenite::Message;

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
pub async fn connect_websocket(
    pod_log_stream: PodLogStream,
    state: State<'_, Mutex<AppData>>,
) -> Result<(), MyError> {
    let (client, wb) = {
        let app_data = state.lock().unwrap();
        (
            app_data.client.clone().unwrap(),
            app_data.websocket.clone().unwrap(),
        )
    };

    let listener = wb.listener.clone();
    // while let Ok((stream, addr)) = listener.lock().await.accept().await {
    //     println!("Peer address: {:?} socket:{:?}", addr, stream);

    //     tokio::spawn(handle_connection(
    //         client.clone(),
    //         stream,
    //         pod_log_stream.clone(),
    //     ));
    // }

    tokio::spawn(async move {
        loop {
            match listener.lock().await.accept().await {
                Ok((stream, addr)) => {
                    println!("----- Peer address: {:?} socket:{:?}", addr, stream);
                    tokio::spawn(handle_connection(
                        client.clone(),
                        stream,
                        pod_log_stream.clone(),
                    ));
                }
                Err(e) => {
                    println!("Error accepting connection: {:?}", e);
                    break;
                }
            }
        }
    });

    Ok(())
}

async fn handle_connection(client: Client, stream: TcpStream, pod_log_stream: PodLogStream) {
    let ws_stream = tokio_tungstenite::accept_async(stream)
        .await
        .expect("Error during the websocket handshake occurred");

    let (mut write, _) = ws_stream.split();
    let pods: Api<Pod> = Api::namespaced(client, &pod_log_stream.namespace);
    let mut logs = pods
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
        .await
        .unwrap()
        .lines();
    while let Some(line) = logs.try_next().await.unwrap() {
        let msg = Message::text(line);
        println!("{} send msg: {:?}", pod_log_stream.pod, msg);
        write.send(msg).await.unwrap();
    }
}
