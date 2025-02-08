import { Tabs, TabsProps } from "antd";
import { AndroidOutlined } from "@ant-design/icons";
import { FC, useRef, useState } from "react";
import "./index.scss";

interface CustomFooterProps {
  children?: React.ReactNode;
}
const CustomFooter: FC<CustomFooterProps> = ({ children }) => {
  type TargetKey = React.MouseEvent | React.KeyboardEvent | string;
  const newTabIndex = useRef(0);
  const [activeKey, setActiveKey] = useState("1");

  const [items, setItems] = useState<TabsProps["items"]>([]);
  const add = (label: string, content: React.ReactNode) => {
    const newActiveKey = `newTab${newTabIndex.current++}`;
    const newPanes = [...(items || [])];
    newPanes.push({
      label: label,
      children: content ? content : "Content of new Tab",
      key: newActiveKey,
      icon: <AndroidOutlined />,
    });
    setItems(newPanes);
    setActiveKey(newActiveKey);
  };

  const remove = (targetKey: TargetKey) => {
    if (!items) return;
    const targetIndex = items.findIndex((item) => item.key === targetKey);
    const newItems = items.filter((item) => item.key !== targetKey);

    if (newItems.length && targetKey === activeKey) {
      const newActiveKey =
        newItems[
          targetIndex === newItems.length ? targetIndex - 1 : targetIndex
        ].key;
      setActiveKey(newActiveKey);
    }

    setItems(newItems);
  };
  const onChange = (newActiveKey: string) => {
    setActiveKey(newActiveKey);
  };
  const onEdit = (targetKey: TargetKey, action: "add" | "remove") => {
    if (action === "add") {
      // add();
    } else {
      remove(targetKey);
    }
  };
  return (
    <Tabs
      type="editable-card"
      defaultActiveKey="2"
      onEdit={onEdit}
      tabBarExtraContent={{
        right: <></>,
      }}
      onChange={onChange}
      activeKey={activeKey}
      items={items}
    />
  );
};

export default CustomFooter;
