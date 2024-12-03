import React, { FC } from "react";

const CustomDragDiv: FC<{ children: React.ReactNode; className?: string }> = (
  props
) => {
  return (
    <div {...props} data-tauri-drag-region>
      {props.children}
    </div>
  );
};

export default CustomDragDiv;
