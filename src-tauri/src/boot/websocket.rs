use arc_swap::ArcSwap;
use futures::{SinkExt, StreamExt};
use std::{collections::HashMap, sync::Arc, time::Duration};
use tokio::{
    net::{TcpListener, TcpStream},
    sync::{mpsc, Mutex},
};
use tokio_tungstenite::tungstenite::Message;
use uuid::Uuid;

type Sender = mpsc::UnboundedSender<Message>;
type ClientMap = Arc<Mutex<HashMap<Uuid, Sender>>>;
type TerminalInputSender = mpsc::UnboundedSender<String>;
type TerminalInputMap = Arc<Mutex<HashMap<Uuid, TerminalInputSender>>>;

#[derive(Clone)]
pub struct WebsocketManager {
    clients: Arc<ArcSwap<ClientMap>>,
    terminal_inputs: Arc<ArcSwap<TerminalInputMap>>,
}

impl WebsocketManager {
    pub fn new() -> Self {
        let client_map: ClientMap = Arc::new(Mutex::new(HashMap::new()));
        let terminal_input_map: TerminalInputMap = Arc::new(Mutex::new(HashMap::new()));
        Self {
            clients: Arc::new(ArcSwap::new(Arc::new(client_map))),
            terminal_inputs: Arc::new(ArcSwap::new(Arc::new(terminal_input_map))),
        }
    }

    pub async fn start_server(&self, port: u16) {
        let listener = TcpListener::bind(format!("127.0.0.1:{}", port))
            .await
            .unwrap();
        while let Ok((stream, _)) = listener.accept().await {
            let clients = self.clients.clone();
            let terminal_inputs = self.terminal_inputs.clone();
            tokio::spawn(async move {
                Self::handle_connection(clients, terminal_inputs, stream).await;
            });
        }
    }

    pub async fn handle_connection(
        clients: Arc<ArcSwap<ClientMap>>,
        terminal_inputs: Arc<ArcSwap<TerminalInputMap>>,
        stream: TcpStream,
    ) {
        let ws_stream = match tokio_tungstenite::accept_async(stream).await {
            Ok(ws) => ws,
            Err(e) => {
                eprintln!("WebSocket handshake failed: {}", e);
                return;
            }
        };

        let (mut ws_sender, mut ws_receiver) = ws_stream.split();
        let client_id = Uuid::new_v4();
        let (tx, mut rx) = mpsc::unbounded_channel();

        let loaded_clients = clients.load();
        {
            let mut guard = loaded_clients.lock().await;
            guard.insert(client_id, tx.clone());
        }

        tokio::time::sleep(Duration::from_millis(1000)).await;
        let client_id_str = client_id.to_string();
        println!("Sending client ID to client: {}", client_id_str);
        if let Err(e) = tx.send(Message::Text(client_id_str.into())) {
            eprintln!("Failed to send client ID to client {}: {}", client_id, e);
            let mut guard = loaded_clients.lock().await;
            guard.remove(&client_id);
            return;
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
                        break;
                    }
                } else {
                    ping_failures = 0;
                }
            }
        });

        let send_task = tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                match ws_sender.send(msg).await {
                    Ok(_) => {}
                    Err(e) => {
                        eprintln!("Send error to client {}: {}", client_id, e);
                        break;
                    }
                }
            }
        });

        let terminal_inputs_recv = terminal_inputs.clone();
        let recv_task = tokio::spawn(async move {
            while let Some(result) = ws_receiver.next().await {
                match result {
                    Ok(msg) => match msg {
                        Message::Pong(_) => {
                            continue;
                        }
                        Message::Close(_) => {
                            println!("Client {} closed connection gracefully", client_id);
                            break;
                        }
                        Message::Text(text) => {
                            // 如果是终端输入，转发给对应的终端会话
                            if let Ok(terminal_input_map) = terminal_inputs_recv.load().try_lock() {
                                if let Some(sender) = terminal_input_map.get(&client_id) {
                                    if let Err(e) = sender.send(text.to_string()) {
                                        eprintln!("Failed to send terminal input: {}", e);
                                    }
                                }
                            }
                        }
                        Message::Binary(data) => {
                            // 处理二进制数据（可能是终端输入）
                            if let Ok(text) = String::from_utf8(data.to_vec()) {
                                if let Ok(terminal_input_map) =
                                    terminal_inputs_recv.load().try_lock()
                                {
                                    if let Some(sender) = terminal_input_map.get(&client_id) {
                                        if let Err(e) = sender.send(text) {
                                            eprintln!("Failed to send terminal input: {}", e);
                                        }
                                    }
                                }
                            }
                        }
                        _ => {
                            println!("Received other message from {}: {:?}", client_id, msg);
                        }
                    },
                    Err(e) => {
                        eprintln!("Receive error from client {}: {}", client_id, e);
                        if e.to_string().contains("Connection reset")
                            || e.to_string().contains("Broken pipe")
                            || e.to_string().contains("Connection aborted")
                        {
                            break;
                        }
                        continue;
                    }
                }
            }
        });

        tokio::select! {
            _ = send_task => {
                println!("Send task ended for client {}", client_id);
            },
            _ = recv_task => {
                println!("Receive task ended for client {}", client_id);
            },
            _ = heartbeat_task => {
                println!("Heartbeat task ended for client {}", client_id);
            },
        }

        println!("Cleaning up connection for client {}", client_id);
        let mut guard = loaded_clients.lock().await;
        guard.remove(&client_id);

        // 清理终端输入通道
        let terminal_inputs_guard = terminal_inputs.load();
        let mut terminal_guard = terminal_inputs_guard.lock().await;
        terminal_guard.remove(&client_id);
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

    pub async fn set_terminal_input(&self, client_id: Uuid, sender: TerminalInputSender) {
        let guard = self.terminal_inputs.load();
        let mut terminal_inputs = guard.lock().await;
        terminal_inputs.insert(client_id, sender);
    }

    pub async fn remove_terminal_input(&self, client_id: Uuid) {
        let guard = self.terminal_inputs.load();
        let mut terminal_inputs = guard.lock().await;
        terminal_inputs.remove(&client_id);
    }
}
