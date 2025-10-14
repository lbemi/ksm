import React, { FC } from "react";
import {emit} from "@tauri-apps/api/event";

const CustomDragDiv: FC<{ children: React.ReactNode; className?: string }> = (
  props
) => {
  return (
    <div {...props} data-tauri-drag-region onMouseDown={() => emit('drag-click', {})}>
      {props.children}
    </div>
  );
};

export default CustomDragDiv;
