import { LogicalPosition } from "@tauri-apps/api/dpi";
import { listen, Options } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

const TrayContextMenu = async () => {
  console.log("TrayContextMenu");
  // 右键菜单宽度
  let menuW = 150;
  // 右键菜单高度
  let menuH = 300;

  // 创建右键菜单
  let webview = new WebviewWindow("win-traymenu", {
    url: "/tray/contextmenu",
    title: "托盘右键菜单",
    width: menuW,
    height: menuH,
    x: window.screen.width,
    y: window.screen.height,
    skipTaskbar: true,
    transparent: true,
    shadow: false,
    decorations: false,
    center: false,
    resizable: false,
    alwaysOnTop: true,
    focus: true,
    visible: false,
  });

  await webview.listen("tauri://window-created", async () => {
    const win = await WebviewWindow.getByLabel("win-traymenu");
    win?.hide();
  });

  await webview.listen("tauri://blur", async () => {
    const win = await WebviewWindow.getByLabel("win-traymenu");
    win?.hide();
  });

  listen("tray_contextmenu", async (event) => {
    console.log("tray_contextmenu: ", event);
    let postion = event.payload;
    const win = await WebviewWindow.getByLabel("win-traymenu");
    if (!win) {
      return;
    }
    win.setAlwaysOnTop(true);
    win.setFocus();
    win.setPosition(new LogicalPosition(postion.x - 5, postion.y - menuH + 5));
    win.show();
  });
};

export default TrayContextMenu;
