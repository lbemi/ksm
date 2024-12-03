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
  const [isMax, setIsMax] = useState(false);

  useEffect(() => {
    let window = WebviewWindow.getCurrent();
    let UnlistenFn = window.listen("tauri://resize", async function () {
      setIsMax(await window.isMaximized());
    });
    return () => {
      UnlistenFn.then((unlisten) => unlisten());
    };
  }, []);

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    }
    WebviewWindow.getCurrent().minimize();
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      WebviewWindow.getCurrent().close();
    }
  };

  const handleHide = () => {
    if (onHide && onMinimize) {
      onMinimize();
    }
    WebviewWindow.getCurrent().hide();
  };

  const handleMaximize = () => {
    if (onHide && onMinimize) {
      onMinimize();
    }
    WebviewWindow.getCurrent().maximize();
  };

  const handleUnMaximize = () => {
    if (onHide && onMinimize) {
      onMinimize();
    }
    WebviewWindow.getCurrent().unmaximize();
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
