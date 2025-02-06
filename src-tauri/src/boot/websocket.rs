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

        let send_task = tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                ws_sender.send(msg).await.unwrap();
            }
        });

        let recv_task = tokio::spawn(async move {
            while let Some(Ok(msg)) = ws_receiver.next().await {
                println!("Received a message from {}: {}", client_id, msg);
            }
        });

        // 等待两个任务结束
        tokio::select! {
            _ = send_task =>{},
            _ = recv_task => {},
        }

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
