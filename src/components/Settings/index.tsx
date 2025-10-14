import { FC } from "react";
import CreateAboutWindow from "@/pages/About/window";
import { Dropdown, MenuProps } from "antd";
import { useAppDispatch } from "@/store/hook";
import { setTheme } from "@/store/modules/theme";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useLocale } from "@/locales";
import MyIcon from "../MyIcon";
const Setting: FC = () => {
  const dispatch = useAppDispatch();
  const { theme, compact, locale } = useSelector(
    (state: RootState) => state.theme
  );
  const { formatMessage } = useLocale();
  const dropdownOnClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "compact") {
      dispatch(setTheme({ compact: !compact }));
    } else {
      dispatch(setTheme({ theme: key as "light" | "dark" }));
    }
  };
  const items: MenuProps["items"] = [
    {
      label: formatMessage({ id: "theme.light" }),
      key: "light",
      icon: <MyIcon type="icon-qiansezhuti1" />,
    },
    {
      label: formatMessage({ id: "theme.dark" }),
      key: "dark",
      icon: <MyIcon type="icon-heisezhuti" />,
    },
    { type: "divider" },
    {
      label: formatMessage({ id: "theme.compact" }),
      key: "compact",
      icon: <MyIcon type="icon-suoxiao" />,
    },
  ];
  const changeLocale = () => {
    if (locale === "en_US") {
      dispatch(setTheme({ locale: "zh_CN" }));
    } else {
      dispatch(setTheme({ locale: "en_US" }));
    }
    window.location.reload();
  };

  return (
    <>
      <div
        data-tauri-drag-region
        className="ml-auto  flex items-center gap-2 h-4 "
      >
        <MyIcon
          type={
            locale === "zh_CN"
              ? "icon-a-zhongyingwenzhongwen"
              : "icon-a-zhongyingwenyingwen"
          }
          onClick={changeLocale}
          className="cursor-pointer"
        />

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
            <MyIcon type="icon-mofabang" className="" />
          </div>
        </Dropdown>
        <MyIcon
          type="icon-xitongguanli"
          onClick={CreateAboutWindow}
          className=" cursor-pointer"
        />
      </div>
    </>
  );
};

export default Setting;
