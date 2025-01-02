import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

const CreateAboutWindow = async () => {
  const window = await WebviewWindow.getByLabel("about");
  if (window) {
    await window.show();
    await window.unminimize();
    await window.setFocus();
    return;
  }
  new WebviewWindow("about", {
    url: "/about",
    title: "关于ksm",
    width: 360,
    height: 510,
    decorations: true,
    center: true,
    transparent: true,
    resizable: false,
    shadow: false,
    focus: true,
    titleBarStyle: "overlay",
    hiddenTitle: true,
  });
};

export default CreateAboutWindow;
