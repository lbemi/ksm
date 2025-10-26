import { TabsProps } from "antd";
import { FC } from "react";
import { Tabs } from "antd";
import About from "./About";
import { useLocale } from "@/locales";
import MyIcon from "@/components/MyIcon";
import ModelConfig from "./ModelConfig";

const onChange = (key: string) => {
  console.log(key);
};

const SettingLayout: FC = () => {
  const { formatMessage } = useLocale();

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: formatMessage({ id: "setting.about" }),
      icon: <MyIcon type="icon-about" />,
      children: <About />,
    },
    {
      key: "2",
      label: formatMessage({ id: "setting.modelConfig" }),
      icon: <MyIcon type="icon-moxingpeizhi" />,
      children: <ModelConfig />,
    },
    {
      key: "3",
      label: formatMessage({ id: "setting.modelConfig" }),
      icon: <MyIcon type="icon-jiqun" />,
      children: <ModelConfig />,
    },
  ];
  return (
    <div>
      <Tabs
        tabPosition="left"
        defaultActiveKey="1"
        items={items}
        className="h-full"
        tabBarGutter={0}
        onChange={onChange}
      />
    </div>
  );
};

export default SettingLayout;
