import { listen } from "@tauri-apps/api/event";
import { WebviewOptions } from "@tauri-apps/api/webview";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getAllWindows } from "@tauri-apps/api/window";
// const _appWindow = getCurrentWindow();

export interface WindowConfig extends WebviewOptions {
  label: string;
  title: string;
  // decorations: boolean;
  // center?: boolean;
  // resizable?: boolean;
  // shadow?: boolean;
  // focus?: boolean;
}

export const windowConfig: WindowConfig = {
  label: "", // 窗口唯一label
  title: "", // 窗口标题
  url: "", // 路由地址url
  width: 1000, // 窗口宽度
  height: 640, // 窗口高度
  x: 600, // 窗口相对于屏幕左侧坐标
  y: 800, // 窗口相对于屏幕顶端坐标
};

class Windows {
  mainWin: null;
  constructor() {
    this.mainWin = null;
  }

  // 创建窗口
  async createWindow(options: WindowConfig) {
    // 合并默认配置和传入的配置,options会覆盖windowConfig中的同名属性
    const args = Object.assign({}, windowConfig, options);
    const existWin = await this.getWindow(args.label);
    if (existWin) {
      return;
    }
    const win = new WebviewWindow(args.label, args);
    await win.once("tauri://created", async () => {
      if (args.label.indexOf("main") > -1) {
        console.log("主窗口创建成功");
      }
    });
    await win.once("tauri://error", function (e) {
      console.log("err: ", e);
    });
  }

  // 获取窗口
  async getWindow(label: string) {
    return await WebviewWindow.getByLabel(label);
  }
  // 获取全部窗口
  async getAllWin() {
    return await getAllWindows();
  }

  async onListen() {
    // 创建新窗体
    await listen("win-create", (event: any) => {
      this.createWindow(event.payload);
    });

    // // 显示窗体
    // await listen("win-show", async () => {
    //   if (appWindow.label.indexOf("main") == -1) return;
    //   await appWindow.show();
    //   await appWindow.unminimize();
    //   await appWindow.setFocus();
    // });

    // // 隐藏窗体
    // await listen("win-hide", async () => {
    //   if (appWindow.label.indexOf("main") == -1) return;
    //   await appWindow.hide();
    // });

    // 关闭窗体
    // await listen("win-close", async () => {
    //   console.log("关闭窗体");
    //   await appWindow.close();
    // });
  }
}

export default { Windows };
