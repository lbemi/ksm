import { getAllWindows, getCurrentWindow } from "@tauri-apps/api/window";
import {
  WebviewWindow,
  getAllWebviewWindows,
  getCurrentWebviewWindow,
} from "@tauri-apps/api/webviewWindow";
import { relaunch, exit } from "@tauri-apps/plugin-process";
import { emit, listen } from "@tauri-apps/api/event";

const appWidows = getCurrentWindow();

export const windowConig = {
  label: null, // 窗口唯一label
  title: "", // 窗口标题
  url: "", // 路由地址url
  width: 1000, // 窗口宽度
  height: 640, // 窗口高度
  minWidth: null, // 窗口最小宽度
  minHeight: null, // 窗口最小高度
  x: null, // 窗口相对于屏幕左侧坐标
  y: null, // 窗口相对于屏幕顶端坐标
  center: true, // 窗口居中显示
  resizable: true, // 是否支持缩放
  maximized: false, // 最大化窗口
  decorations: false, // 窗口是否装饰边框及导航条
  alwaysOnTop: false, // 置顶窗口
  dragDropEnabled: false, // 禁止系统拖放
  visible: false, // 隐藏窗口
};

// class Windows {
//   constructor() {
//     this.mainWin = null;
//   }
//   async createWin(options) {
//     const args = Object.assign({}, windowConig, options);
//     const existWin = await this.getWin(args.label);
//     if (existWin) {
//       return existWin;
//     }
//     const win = new WebviewWindow(args.label, args);
//     win.once("tauri:://created", async () => {});
//   }

//   // 获取窗口
//   async getWin(label) {
//     return await WebviewWindow.getByLabel(label);
//   }

//   // 获取全部窗口
//   async getAllWin() {
//     return await getAllWindows();
//   }

//   // 开启主进程监听事件
//   async listen() {
//     console.log("——+——+——+——+——+开始监听窗口");
//     // 创建新窗体
//     await listen("win-create", (event) => {
//       console.log(event);
//       this.createWin(event.payload);
//     });

//     // 显示窗体
//     await listen("win-show", async (event) => {
//       if (appWindow.label.indexOf("main") == -1) return;
//       await appWindow.show();
//       await appWindow.unminimize();
//       await appWindow.setFocus();
//     });

//     // 隐藏窗体
//     await listen("win-hide", async (event) => {
//       if (appWindow.label.indexOf("main") == -1) return;
//       await appWindow.hide();
//     });

//     // 关闭窗体
//     await listen("win-close", async (event) => {
//       await appWindow.close();
//     });
//   }
// }

// export default Windows;
