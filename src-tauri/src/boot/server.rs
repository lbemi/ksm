use tauri::{Manager, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

use crate::{
    api::{cluster, custom_api, pods::pod},
    tray::create_tray,
};

use super::setup;

#[cfg_attr(mobile, tauri::mobile_entry_point, desktop)]
pub fn run() {
    tracing_subscriber::fmt::init();
    tauri::Builder::default()
        .setup(setup::init)
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_websocket::init())
        .invoke_handler(tauri::generate_handler![
            cluster::switch_cluster,
            cluster::list_clusters,
            pod::list_pods,
            pod::watch_pods,
            custom_api::kubernetes_api,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
