use futures::{StreamExt, TryStreamExt};
use futures_channel::mpsc::{unbounded, UnboundedSender};
use futures_util::{future, pin_mut};
use std::{collections::HashMap, net::SocketAddr, sync::Arc, time::Duration};
use tokio::{
    net::{TcpListener, TcpStream},
    sync::Mutex,
    time::sleep,
};
use tokio_tungstenite::tungstenite::protocol::Message;

type Tx = UnboundedSender<Message>;
type PeerMap = Arc<Mutex<HashMap<SocketAddr, Tx>>>;

#[derive(Clone)]
pub struct Websocket {
    pub listener: Arc<Mutex<TcpListener>>,
    pub peer_map: PeerMap,
}

impl Websocket {
    pub async fn new(addr: &str) -> Self {
        let server = TcpListener::bind(addr).await.unwrap();
        Self {
            listener: Arc::new(Mutex::new(server)),
            peer_map: Arc::new(Mutex::new(HashMap::new())),
        }
    }
    pub async fn listen(&self) {
        println!("websocket ----: listening on");
        while let Ok((stream, addr)) = self.listener.lock().await.accept().await {
            let w = self.clone();
            tokio::spawn(async move { w.handle_connection(stream, addr).await });

            // let peer = stream
            //     .peer_addr()
            //     .expect("connected streams should have a peer address");
            // println!("websocket ----: peer address: {} socket:{}", peer, addr);
        }
        println!("退出监听");
        // loop {
        //     match self.listener.lock().await.accept().await {
        //         Ok((stream, addr)) => {
        //             let peer = stream
        //                 .peer_addr()
        //                 .expect("connected streams should have a peer address");
        //             println!("websocket ----: peer address: {} socket:{}", peer, addr);
        //         }
        //         Err(e) => {
        //             println!("websocket ----: error: {}", e);
        //         }
        //     }
        //     sleep(Duration::from_secs(2)).await;
        // }
    }

    async fn handle_connection(&self, raw_stream: TcpStream, addr: SocketAddr) {
        println!("Incoming TCP connection from: {}", addr);

        let ws_stream = tokio_tungstenite::accept_async(raw_stream)
            .await
            .expect("Error during the websocket handshake occurred");
        println!("WebSocket connection established: {}", addr);

        // Insert the write part of this peer to the peer map.
        let (tx, rx) = unbounded();
        self.peer_map.lock().await.insert(addr, tx);

        let (outgoing, incoming) = ws_stream.split();
        let peers = self.peer_map.lock().await.clone();
        let broadcast_incoming = incoming.try_for_each(|msg| {
            println!(
                "Received a message from {}: {}",
                addr,
                msg.to_text().unwrap()
            );

            // We want to broadcast the message to everyone except ourselves.
            let broadcast_recipients = peers
                .iter()
                .filter(|(peer_addr, _)| peer_addr != &&addr)
                .map(|(_, ws_sink)| ws_sink);

            for recp in broadcast_recipients {
                recp.unbounded_send(msg.clone()).unwrap();
            }

            future::ok(())
        });

        let receive_from_others = rx.map(Ok).forward(outgoing);

        pin_mut!(broadcast_incoming, receive_from_others);
        future::select(broadcast_incoming, receive_from_others).await;

        println!("{} disconnected", &addr);
        self.peer_map.lock().await.remove(&addr);
    }
}
