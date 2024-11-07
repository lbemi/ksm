import { FC, useEffect, useState } from "react";
import "./index.scss";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
interface Props {
  color?: string | undefined;
  // 窗口是否可最小化
  minimizable: boolean | string;
  maximizable: boolean | string;
  closable: boolean | string;
  zIndex?: number | string;
  // 关闭前回调，会暂停实例关闭 function(done)，done用于关闭
  beforeClose: Function;
}
// interface State {
//   hasMaximized: boolean;
//   isResizable: boolean;
//   isMaximizable: boolean;
// }
const TopBar: FC<{ props: Props }> = ({ props }) => {
  const [state, setState] = useState({
    hasMaximized: false,
    isResizable: false,
    isMaximizable: false,
  });

  // 实时监听窗口是否最大化
  useEffect(() => {
    // listen("tauri://resize", async () => {
    //   console.log("监听窗口是否最大化");
    //   state.hasMaximized = await getCurrentWindow().isMaximized();
    // });
    // 用户是否可以手动调整窗口大小
    // getCurrentWindow()
    //   .isResizable()
    //   .then((win) => {
    //     setState({
    //       ...state,
    //       isResizable: win,
    //     });
    //   });
    // // 窗口是否可以最大化
    // getCurrentWindow()
    //   .isMaximizable()
    //   .then((res) => {
    //     setState({
    //       ...state,
    //       isMaximizable: res,
    //     });
    //   });
    // // 初始监听窗口是否最大化
    // getCurrentWindow()
    //   .isMaximized()
    //   .then((res) => {
    //     setState({
    //       ...state,
    //       hasMaximized: res,
    //     });
    //   });
  }, []);
  // 最小化
  const handleWinMin = async () => {
    await getCurrentWindow().minimize();
  };
  // 最大化/还原
  const handleWinToggle = async () => {
    await getCurrentWindow().toggleMaximize();
  };
  // 关闭
  const handleClose = async () => {
    const isMajor = getCurrentWindow().label.indexOf("main") > -1;
    if (isMajor) {
      console.log("获取到主窗口信息", isMajor);

      // let el = layer({
      //   type: "android",
      //   content: "是否最小化到托盘，不退出程序?",
      //   layerStyle: "background: #f9f9f9; border-radius: 8px;",
      //   closable: false,
      //   resize: false,
      //   btns: [
      //     {
      //       text: "最小化托盘",
      //       style: "color: #646cff",
      //       click: async () => {
      //         console.log("最小化托盘");
      //         // layer.close(el);
      //         // // winSet('hide')
      //         // await getCurrentWindow().hide();
      //       },
      //     },
      //     {
      //       text: "退出程序",
      //       style: "color: #fa5151",
      //       click: async () => {
      //         console.log("退出程序");
      //         // authstate.logout();
      //         // await exit();
      //       },
      //     },
      //   ],
      // });
    } else {
      await getCurrentWindow().close();
    }
  };
  return (
    <>
      <div
        className="topbar"
        data-tauri-drag-region
        style={{ zIndex: props.zIndex, backgroundColor: props.color }}
      >
        <a onClick={handleWinMin}>最小化</a>
        <a onClick={handleClose}>关闭</a>
      </div>
    </>
  );
};

export default TopBar;
