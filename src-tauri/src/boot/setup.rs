use crate::tray::create_tray;
use kube::config::Kubeconfig;
use std::sync::Mutex;
use tauri::{Manager, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

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

pub fn init(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    app.manage(Mutex::new(AppData::load_config()));
    let handle = app.handle();

    #[cfg(all(desktop))]
    {
        create_tray(handle)?; //注册托盘菜单
    }

    // let handle = handle.clone();
    let mut core_window =
        WebviewWindowBuilder::new(app, "core", WebviewUrl::default()).title("Kubernetes manger");

    #[cfg(target_os = "macos")]
    {
        core_window = core_window
            .title_bar_style(TitleBarStyle::Overlay)
            .hidden_title(true);
    }

    core_window
        .resizable(true)
        .inner_size(1300.0, 800.0)
        .min_inner_size(1000.0, 600.0)
        .build()
        .expect("Failed to create core window");
    // let win_size = core_window
    //     .inner_size()
    //     .expect("Failed to get core window size"); // 获取窗口大小

    // let window = Arc::new(Mutex::new(core_window));

    // let titlebar_view =
    //     WebviewWindowBuilder::new(app, "titlebar", WebviewUrl::App("index.html".into()))
    //         .auto_resize();
    // let win = window.lock().unwrap();
    // let scale_factor = win.scale_factor().unwrap(); // 获取缩放因子
    // #[cfg(target_os = "macos")]
    // {}
    // let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
    //     .title("Kubernetes manger")
    //     .inner_size(800.0, 600.0);

    // 仅在 macOS 时设置透明标题栏
    // #[cfg(target_os = "macos")]
    // let win_builder = win_builder.title_bar_style(TitleBarStyle::Overlay);

    // let window = win_builder.build().unwrap();

    // 仅在构建 macOS 时设置背景颜色
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
}
