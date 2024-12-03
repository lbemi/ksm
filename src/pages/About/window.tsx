import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

const CreateAboutWindow = async () => {
  const window = await WebviewWindow.getByLabel("about");
  if (window) {
    window.show();
    window.unminimize();
    window.setFocus();
    return;
  }
  new WebviewWindow("about", {
    url: "/about",
    title: "关于linyu",
    width: 360,
    height: 510,
    decorations: false,
    center: true,
    transparent: true,
    resizable: false,
    shadow: false,
    focus: true,
  });
};

export default CreateAboutWindow;
