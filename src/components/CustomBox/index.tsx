import React, { FC, useEffect, useState } from "react";
import CustomDragDiv from "../CustomDragDiv";
import "./index.scss";
import {WebviewWindow} from "@tauri-apps/api/webviewWindow";

const CustomBox: FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  let [isFull, setIsFull] = useState(false);
  useEffect(() => {
    const window = WebviewWindow.getCurrent();
    let unResize = window.listen("tauri://resize", async function () {
      let isFull = await window.isMaximized();
      setIsFull(isFull);
    });
    // 清理函数
    return () => {
      unResize.then((unlisted) => unlisted());
    };
  });

  return (
    <>
      <div className={`custom-box-container ${isFull ? "full" : ""}`}>
        <CustomDragDiv className={`custom-box ${className}`}>
          {children}
        </CustomDragDiv>
      </div>
    </>
  );
};

export default CustomBox;
