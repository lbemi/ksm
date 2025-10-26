import { FC } from "react";
import { Dropdown, MenuProps } from "antd";
import { useAppDispatch } from "@/store/hook";
import { setTheme } from "@/store/modules/theme";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useLocale } from "@/locales";
import MyIcon from "../MyIcon";
import { useNavigate } from "react-router-dom";
const Setting: FC<{ setCollapsed: () => void }> = ({ setCollapsed }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

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
  const redirectToSetting = () => {
    navigate("/setting/home");
    setCollapsed();
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
          onClick={redirectToSetting}
          className=" cursor-pointer"
        />
      </div>
    </>
  );
};

export default Setting;
