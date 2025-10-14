import { LogicalPosition } from "@tauri-apps/api/dpi";
import { listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export let messageBoxWindowWidth = 280;
export let messageBoxWindowHeight = 100;
export const CreateMsgBox = async () => {
  console.log("CreateMsgBox-----");
  let webview = new WebviewWindow("trayMessageBox", {
    url: "/msg",
    title: "消息通知",
    width: messageBoxWindowWidth,
    height: messageBoxWindowHeight,
    skipTaskbar: true,
    decorations: false,
    resizable: false,
    alwaysOnTop: true,
    focus: true,
    center: false,
    x: window.screen.width + 250,
    y: window.screen.height + 450,
    visible: false,
  });

  await webview.listen("tauri://window-created", async () => {
    console.log("message box created");
  });

  await webview.listen("tauri://blur", async () => {
    console.log("message box blur");
    const win = await WebviewWindow.getByLabel("trayMessageBox");
    await win?.hide();
  });

  await webview.listen("tauri://error", async (error) => {
    console.log("message error: ", error);
  });

   listen("tray_mouseenter", async (event) => {
    console.log("开启监听：", event);

    const win = await WebviewWindow.getByLabel("trayMessageBox");
    if (!win) return;
    let position: any = event.payload;
    await win.setAlwaysOnTop(true);
    await win.setFocus();
    await win.setPosition(
      new LogicalPosition(
        position.x - messageBoxWindowWidth / 2,
        position.y - messageBoxWindowHeight
      )
    );
    await win.show();
  });
  listen("tray_mouseleave", async () => {
    const win = await WebviewWindow.getByLabel("trayMessageBox");
    if (!win) return;
    await win.hide();
  });
};

export default CreateMsgBox;
