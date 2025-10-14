use crate::api::{cluster, k8s_proxy, pods::pod, websocket};

use super::setup;

#[cfg(target_os = "macos")]
use super::traffic_light_plugin;

#[cfg_attr(mobile, tauri::mobile_entry_point, desktop)]
pub fn run() {
    tracing_subscriber::fmt::init();
    let builder = tauri::Builder::default()
        .setup(setup::init)
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_websocket::init());

    #[cfg(target_os = "macos")]
    let builder = builder.plugin(traffic_light_plugin::init());

    builder
        .invoke_handler(tauri::generate_handler![
            cluster::switch_cluster,
            cluster::list_clusters,
            pod::watch_pods,
            k8s_proxy::proxy_request,
            websocket::log_stream,
            websocket::pod_terminal,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
