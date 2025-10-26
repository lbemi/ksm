use crate::tray::create_tray;
use kube::config::Kubeconfig;
use std::sync::Mutex;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[cfg(target_os = "macos")]
use tauri::TitleBarStyle;
use tauri_plugin_updater::UpdaterExt;
use tokio::runtime;

use super::websocket;

const WEBSOCKET_PORT: u16 = 38012;

#[derive(Default)]
pub struct AppData {
    pub kubernetes_configs: Kubeconfig,
    pub client: Option<kube::Client>,
    pub discovery: Option<kube::Discovery>,
    pub websocket: Option<websocket::WebsocketManager>,
}

impl AppData {
    fn new() -> Self {
        AppData {
            kubernetes_configs: Kubeconfig::read().unwrap_or(Kubeconfig::default()),
            client: None,
            discovery: None,
            websocket: Some(websocket::WebsocketManager::new()),
        }
    }
}

pub fn init(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let rt = runtime::Runtime::new().unwrap();
    let app_data = rt.block_on(async {
        let app_data = AppData::new();
        // Start websocket server
        if let Some(ws) = &app_data.websocket {
            let ws_clone = ws.clone();
            tokio::spawn(async move {
                ws_clone.start_server(WEBSOCKET_PORT).await;
            });
        }
        app_data
    });

    // Manage both the AppData and Runtime
    app.manage(Mutex::new(app_data));
    app.manage(rt);

    #[cfg(all(desktop))]
    {
        create_tray(app.handle())?;
    }

    let core_window = {
        let mut builder = WebviewWindowBuilder::new(app, "core", WebviewUrl::default())
            .title("Kubernetes manger");

        #[cfg(target_os = "macos")]
        {
            builder = builder
                .title_bar_style(TitleBarStyle::Overlay)
                .hidden_title(true);
        }

        builder
    };

    core_window
        .resizable(true)
        .inner_size(1300.0, 800.0)
        .min_inner_size(1000.0, 600.0)
        .build()
        .expect("Failed to create core window");

    Ok(())
}
