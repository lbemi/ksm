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
use tokio::net::{TcpListener, TcpStream};
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
    let client = {
        let app_data = state.lock().unwrap();
        app_data.client.clone().unwrap()
    };
    let listener = TcpListener::bind("127.0.0.1:38012").await.unwrap();

    tokio::spawn(async move {
        while let Ok((stream, addr)) = listener.accept().await {
            let peer = stream
                .peer_addr()
                .expect("connected streams should have a peer address");
            println!("Peer address: {} socket:{}", peer, addr);
            let client_clone = client.clone();
            let log_stream = pod_log_stream.clone();
            tokio::spawn(async move {
                handle_connection(client_clone, stream, log_stream).await;
            });
        }
    });

    Ok(())
}

async fn handle_connection<'a>(client: Client, stream: TcpStream, pod_log_stream: PodLogStream) {
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
        write.send(msg).await.unwrap();
    }
}
