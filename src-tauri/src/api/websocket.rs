use crate::{boot::setup::AppData, error::MyError};
use futures::{AsyncBufReadExt, SinkExt, StreamExt, TryStreamExt};
use k8s_openapi::{
    api::core::v1::Pod,
    chrono::{DateTime, Utc},
};
use kube::{api::LogParams, Api, Client};
use serde::Deserialize;
use std::{collections::HashMap, net::SocketAddr, sync::Arc};
use tauri::State;
use tokio::{net::TcpStream, sync::Mutex};
use tokio_tungstenite::tungstenite::Message;
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
pub async fn connect_websocket(
    pod_log_stream: PodLogStream,
    client_id: String,
    state: State<'_, Mutex<AppData>>,
) -> Result<(), MyError> {
    let (client, ws_manager) = {
        let app_data = state.lock().await;
        (
            app_data.client.clone().unwrap(),
            app_data.websocket.clone().unwrap(),
        )
    };
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
    let client_id = Uuid::parse_str(&client_id).unwrap();
    while let Some(line) = logs.try_next().await.unwrap() {
        let msg = Message::text(line);
        // 直接发送消息给当前连接的websocket客户端
        ws_manager
            .send_message(client_id, msg.to_string())
            .await
            .unwrap();
    }

    // let listener = ws_manager.send_message(client_id, message).await;
    // tokio::spawn(async move {
    //     loop {
    //         match listener.lock().await.accept().await {
    //             Ok((stream, addr)) => {
    //                 println!("----- Peer address: {:?} socket:{:?}", addr, stream);

    //                 tokio::spawn(handle_connection(
    //                     client.clone(),
    //                     stream,
    //                     pod_log_stream.clone(),
    //                     addr,
    //                     peer_map.clone(),
    //                 ));
    //             }
    //             Err(e) => {
    //                 println!("Error accepting connection: {:?}", e);
    //                 break;
    //             }
    //         }
    //     }
    // });

    Ok(())
}

async fn handle_connection(
    client: Client,
    stream: TcpStream,
    pod_log_stream: PodLogStream,
    addr: SocketAddr,
    peer_map: Arc<Mutex<HashMap<String, SocketAddr>>>,
) {
    // peer_map
    //     .lock()
    //     .await
    //     .insert(pod_log_stream.pod.clone(), addr);
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
        // 直接发送消息给当前连接的websocket客户端
        if let Err(e) = write.send(msg).await {
            println!("Error sending message: {:?}", e);
            break;
        }
    }

    // 连接关闭时，从peer_map中移除
    // peer_map.lock().await.remove(&pod_log_stream.pod);
}
