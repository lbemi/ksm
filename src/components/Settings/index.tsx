import { FC, useState } from "react";
import "./index.scss";
import UIcon from "../UIcon";
import CreateAboutWindow from "@/pages/About/window";
import { Dropdown, MenuProps } from "antd";
import { useAppDispatch } from "@/store/hook";
import { setTheme } from "@/store/modules/theme";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
const Setting: FC = () => {
  const dispatch = useAppDispatch();
  const { theme, compact, locale } = useSelector(
    (state: RootState) => state.theme
  );
  const dropdownOnClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "compact") {
      dispatch(setTheme({ compact: !compact }));
    } else {
      dispatch(setTheme({ theme: key as "light" | "dark" }));
    }
  };
  const items: MenuProps["items"] = [
    { label: "light", key: "light", icon: <UIcon type="icon-qiansezhuti1" /> },
    { label: "dark", key: "dark", icon: <UIcon type="icon-heisezhuti" /> },
    { type: "divider" },
    {
      label: "compact",
      key: "compact",
      icon: <UIcon type="icon-suoxiao" />,
    },
  ];
  const changeLocale = () => {
    if (locale === "en_US") {
      dispatch(setTheme({ locale: "zh_CN" }));
    } else {
      dispatch(setTheme({ locale: "en_US" }));
    }
  };

  return (
    <>
      <div data-tauri-drag-region className="setting">
        <div style={{ display: "flex", alignItems: "center" }}>
          <div className="mr-2.5 cursor-pointer">
            <UIcon
              type={
                locale === "zh_CN"
                  ? "icon-a-zhongyingwenzhongwen"
                  : "icon-a-zhongyingwenyingwen"
              }
              onClick={changeLocale}
            />
          </div>
          <div>
            <Dropdown
              menu={{
                items,
                onClick: dropdownOnClick,
                selectable: true,
                selectedKeys: [theme, compact ? "compact" : ""],
              }}
            >
              <div
                onClick={(e) => {
                  e.preventDefault();
                }}
                className="cursor-pointer"
              >
                <UIcon type="icon-mofabang" className="" />
              </div>
            </Dropdown>
          </div>
          <UIcon
            type="icon-xitongguanli"
            onClick={CreateAboutWindow}
            className="setting-icon cursor-pointer"
          />
        </div>
      </div>
    </>
  );
};

export default Setting;
