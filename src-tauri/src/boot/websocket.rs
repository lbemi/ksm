use arc_swap::ArcSwap;
use futures::{SinkExt, StreamExt};
use std::{collections::HashMap, sync::Arc};
use tokio::{
    net::{TcpListener, TcpStream},
    sync::{mpsc, Mutex},
};
use tokio_tungstenite::tungstenite::Message;
use uuid::Uuid;

type Sender = mpsc::UnboundedSender<Message>;
type ClientMap = Arc<Mutex<HashMap<Uuid, Sender>>>;

#[derive(Clone)]
pub struct WebsocketManager {
    clients: Arc<ArcSwap<ClientMap>>,
}

impl WebsocketManager {
    pub fn new() -> Self {
        let client_map: ClientMap = Arc::new(Mutex::new(HashMap::new()));
        Self {
            clients: Arc::new(ArcSwap::new(Arc::new(client_map))),
        }
    }

    pub async fn start_server(&self, port: u16) {
        let listener = TcpListener::bind(format!("127.0.0.1:{}", port))
            .await
            .unwrap();
        while let Ok((stream, _)) = listener.accept().await {
            let clients = self.clients.clone();
            tokio::spawn(async move {
                Self::handle_connection(clients, stream).await;
            });
        }
    }

    pub async fn handle_connection(clients: Arc<ArcSwap<ClientMap>>, stream: TcpStream) {
        let ws_stream = tokio_tungstenite::accept_async(stream)
            .await
            .expect("Websocket handshake failed");
        let (mut ws_sender, mut ws_receiver) = ws_stream.split();
        let client_id = Uuid::new_v4();
        let (tx, mut rx) = mpsc::unbounded_channel();

        let loaded_clients = clients.load();
        {
            let mut guard = loaded_clients.lock().await;
            guard.insert(client_id, tx.clone());
        }
        if let Err(e) = tx.send(Message::Text(client_id.to_string().into())) {
            eprintln!("Failed to send message: {}", e);
        }

        let mut ping_interval = tokio::time::interval(tokio::time::Duration::from_secs(5));
        let ping_tx = tx.clone();
        let mut ping_failures = 0;

        let heartbeat_task = tokio::spawn(async move {
            loop {
                ping_interval.tick().await;
                if let Err(_) = ping_tx.send(Message::Ping("ping".into())) {
                    ping_failures += 1;
                    if ping_failures >= 3 {
                        // 连续3次ping失败才断开
                        break;
                    }
                } else {
                    ping_failures = 0; // 成功发送则重置失败计数
                }
            }
        });

        let send_task = tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                match ws_sender.send(msg).await {
                    Ok(_) => {}
                    Err(_e) => {
                        break;
                    }
                }
            }
        });

        let recv_task = tokio::spawn(async move {
            while let Some(result) = ws_receiver.next().await {
                match result {
                    Ok(msg) => match msg {
                        Message::Pong(_) => {
                            continue;
                        }
                        Message::Close(_) => {
                            break;
                        }
                        _ => {
                            println!("Received a message from {}: {}", client_id, msg);
                        }
                    },
                    Err(e) => {
                        eprintln!("Receive error: {}", e);
                        // 接收错误继续尝试,不立即断开
                        continue;
                    }
                }
            }
        });

        // 等待任意任务结束
        tokio::select! {
            _ = send_task => {},
            _ = recv_task => {},
            _ = heartbeat_task => {},
        }

        // 只有在确实需要断开时才移除客户端
        let mut guard = loaded_clients.lock().await;
        guard.remove(&client_id);
    }

    pub async fn send_message(&self, client_id: Uuid, message: String) -> Result<(), String> {
        let guard = self.clients.load();
        let clients = guard.lock().await;
        if let Some(sender) = clients.get(&client_id) {
            sender
                .send(Message::Text(message.into()))
                .map_err(|e| e.to_string())
        } else {
            Err("client not found".to_string())
        }
    }
}
