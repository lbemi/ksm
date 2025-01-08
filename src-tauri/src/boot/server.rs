use crate::api::{cluster, k8s_proxy, pods::pod};

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
            pod::watch_pods,
            k8s_proxy::proxy_request
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
