import { FC } from "react";
import "./index.scss";
import { useThemeMode } from "antd-style";
import UIcon from "../UIcon";
import CreateAboutWindow from "@/pages/About/window";

const Setting: FC = () => {
  const { themeMode, setThemeMode } = useThemeMode();
  const toggleTheme = () => {
    setThemeMode(themeMode === "light" ? "dark" : "light");
  };

  return (
    <>
      <div data-tauri-drag-region className="setting">
        <div style={{ display: "flex", alignItems: "center" }}>
          <UIcon type="icon-zhutiqiehuan" onClick={toggleTheme} />
          <UIcon
            type="icon-xitongguanli"
            onClick={CreateAboutWindow}
            className="setting-icon"
          />
        </div>
      </div>
    </>
  );
};

export default Setting;
