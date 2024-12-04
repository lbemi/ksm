use std::sync::Mutex;

use kube::config::Kubeconfig;
use tauri::{Manager, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

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
            // let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
            //     .title("Kubernetes manger")
            //     .inner_size(800.0, 600.0);

            // // 仅在 macOS 时设置透明标题栏
            // #[cfg(target_os = "macos")]
            // let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);

            // let window = win_builder.build().unwrap();

            // // 仅在构建 macOS 时设置背景颜色
            // #[cfg(target_os = "macos")]
            // {
            //     use cocoa::appkit::{NSColor, NSWindow};
            //     use cocoa::base::{id, nil};

            //     let ns_window = window.ns_window().unwrap() as id;
            //     unsafe {
            //         // let bg_color = NSColor::colorWithRed_green_blue_alpha_(
            //         //     nil,
            //         //     50.0 / 255.0,
            //         //     158.0 / 255.0,
            //         //     163.5 / 255.0,
            //         //     1.0,
            //         // );
            //         //设置磨砂背景
            //         let bg_color =
            //             NSColor::colorWithRed_green_blue_alpha_(nil, 0.95, 0.95, 0.95, 1.0);
            //         ns_window.setBackgroundColor_(bg_color);
            //     }
            // }
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
