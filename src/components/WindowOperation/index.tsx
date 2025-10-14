import "./index.scss";
import IconButton from "../IconButton/index.js";
import { FC, useEffect, useState } from "react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

interface WindowOperationProps {
  hide?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onHide?: () => void;
  height?: number | string;
  isMaximize?: boolean;
  isMinimize?: boolean;
  style?: React.CSSProperties;
}

const WindowOperation: FC<WindowOperationProps> = ({
  hide = true,
  onClose,
  onMinimize,
  onHide,
  height,
  isMaximize = true,
  isMinimize = true,
  style = {},
}) => {
  const [isMax, _setIsMax] = useState(false);
  // const setMaxStatus =async () => {
  //   let window = WebviewWindow.getCurrent();
  //   await window.listen("tauri://resize", async () => {
  //     setIsMax(await window.isMaximized());
  //   });
  // };
  useEffect(() => {
    // let window = WebviewWindow.getCurrent();
    // let listened = window.listen("tauri://resize", async () => {
    //   setIsMax(await window.isMaximized());
    // })
    // return () => {
    //   listened.then((unlisted) => unlisted());
    // }
  }, []);

  const handleMinimize = async () => {
    if (onMinimize) {
      onMinimize();
    }
    await WebviewWindow.getCurrent().minimize();
  };

  const handleClose = async () => {
    if (onClose) {
      onClose();
    } else {
      await WebviewWindow.getCurrent().close();
    }
  };

  const handleHide = async () => {
    if (onHide && onMinimize) {
    }
    await WebviewWindow.getCurrent().hide();
  };

  const handleMaximize = async () => {
    if (onHide && onMinimize) {
    }
    await WebviewWindow.getCurrent().maximize();
    // setMaxStatus();
  };

  const handleUnMaximize = async () => {
    if (onHide && onMinimize) {
      onMinimize();
    }
    await WebviewWindow.getCurrent().unmaximize();
  };

  return (
    <div className="window-operation" style={{ height: height, ...style }}>
      {isMinimize && (
        <IconButton
          icon={
            <i
              className={`iconfont icon-zuixiaohua`}
              style={{ fontSize: 22 }}
            />
          }
          onClick={handleMinimize}
        />
      )}
      {isMaximize && (
        <IconButton
          icon={
            <i
              className={`iconfont ${
                isMax ? "icon-chuangkouhua" : "icon-zuidahua"
              }`}
              style={{ fontSize: 18 }}
            />
          }
          onClick={isMax ? handleUnMaximize : handleMaximize}
        />
      )}
      <IconButton
        danger
        icon={<i className={`iconfont icon-guanbi`} style={{ fontSize: 22 }} />}
        onClick={hide ? handleHide : handleClose}
      />
    </div>
  );
};
export default WindowOperation;
