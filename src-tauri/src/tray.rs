use tauri::{
    menu::{Menu, MenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

pub fn create_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let show_i = MenuItem::with_id(app, "show", "显示", true, None::<&str>)?;
    let hide_i = MenuItem::with_id(app, "hide", "隐藏", true, None::<&str>)?;
    let about_i = MenuItem::with_id(app, "about", "关于", true, None::<&str>)?;

    let edit_i = MenuItem::with_id(app, "edit_file", "编辑", true, None::<&str>)?;
    let new_i = MenuItem::with_id(app, "new_file", "添加", true, None::<&str>)?;

    let a = Submenu::with_id_and_items(app, "File", "文件", true, &[&edit_i, &new_i])?;

    let menu = Menu::with_items(app, &[&quit_i, &show_i, &hide_i, &about_i, &a])?;
    let _ = TrayIconBuilder::with_id("tray")
        .tooltip("something")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                let window = app.get_webview_window("main").unwrap();
                let _ = window.show();
            }
            "hide" => {
                let window = app.get_webview_window("main").unwrap();
                let _ = window.hide();
            }
            "edit_file" => {
                println!("edit_file");
            }
            "new_file" => {
                println!("new_file");
            }
            "about" => app.emit("tary_about", ()).unwrap(),
            // Add more events here
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                id: _,
                position,
                rect: _,
                button,
                button_state: _,
            } => match button {
                MouseButton::Left {} => {
                    let windows = tray.app_handle().webview_windows();
                    for (key, value) in windows {
                        println!("点击左键：{}", key);
                        if key == "main-login" || key == "main" {
                            value.show().unwrap();
                            value.unmaximize().unwrap();
                            value.set_focus().unwrap();
                        }
                    }
                }
                MouseButton::Right {} => {
                    println!("点击右键");
                    tray.app_handle()
                        .emit("tray_contextmenu", position)
                        .unwrap();
                }
                _ => {}
            },

            TrayIconEvent::Enter {
                id: _,
                position,
                rect: _,
            } => {
                println!("鼠标滑过托盘");
                tray.app_handle().emit("tray_mouseenter", position).unwrap();
            }
            TrayIconEvent::Leave {
                id: _,
                position,
                rect: _,
            } => {
                println!("鼠标离开托盘");
                tray.app_handle().emit("tray_mouseleave", position).unwrap();
            }
            _ => {}
        })
        .build(app);
    Ok(())
}
