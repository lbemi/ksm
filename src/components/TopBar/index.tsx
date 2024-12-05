import { FC } from "react";
import "./index.scss";
import WindowOperation from "../WindowOperation";

const TopBar: FC = () => {
  return (
    <>
      <div data-tauri-drag-region>
        <WindowOperation
          hide={true}
          height={40}
          style={{ right: 10 }}
          isMaximize={true}
        />
      </div>
    </>
  );
};

export default TopBar;
