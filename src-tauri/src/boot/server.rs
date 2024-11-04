use std::sync::Mutex;

use kube::config::Kubeconfig;
use tauri::Manager;

use crate::{
    api::{cluster, custom_api, pods::pod},
    tray::create_tray,
};

#[derive(Default)]
pub struct AppData {
    pub kubernetes_configs: Kubeconfig,
    pub client: Option<kube::Client>,
    pub discovery: Option<kube::Discovery>,
}
impl AppData {
    fn load_config() -> Self {
        AppData {
            kubernetes_configs: Kubeconfig::read().unwrap_or(Kubeconfig::default()),
            client: None,
            discovery: None,
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point, desktop)]
pub fn run() {
    tracing_subscriber::fmt::init();
    tauri::Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(AppData::load_config()));
            #[cfg(all(desktop))]
            {
                let handle = app.handle();
                create_tray(handle)?; //注册托盘菜单
            }
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            cluster::switch_cluster,
            cluster::list_clusters,
            pod::list_pods,
            custom_api::kubernetes_api,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
