import { Tabs, TabsProps } from "antd";
import { AndroidOutlined } from "@ant-design/icons";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";
import "./index.scss";

import Log from "../CustomLog";
import TerminalWindow from "../Terminal";
import MyIcon from "../MyIcon";
import { createWindow } from "@/utils/windows/actions";

export interface CustomFooterRef {
  add: (
    action: "ssh" | "log" | "empty",
    name: string,
    namespace: string,
    container?: string
  ) => void;
}
interface CustomFooterProps {
  children?: React.ReactNode;
}

const CustomFooter = forwardRef<CustomFooterRef, CustomFooterProps>(
  (_, ref) => {
    type TargetKey = React.MouseEvent | React.KeyboardEvent | string;
    const newTabIndex = useRef(0);
    const [activeKey, setActiveKey] = useState("0");
    const [items, setItems] = useState<TabsProps["items"]>([]);
    const itemsRef = useRef<TabsProps["items"]>([]);

    const remove = useCallback(
      (targetKey: TargetKey) => {
        console.log("remove--", itemsRef.current, targetKey);
        const targetIndex = itemsRef.current!.findIndex(
          (pane) => pane.key === targetKey
        );
        const newPanes = itemsRef.current!.filter(
          (pane) => pane.key !== targetKey
        );
        let newActiveKey = activeKey;
        if (newPanes?.length && targetKey === activeKey) {
          // 修复activeKey选择逻辑
          let newKey;
          if (targetIndex >= newPanes.length) {
            // 如果删除的是最后一个tab，选择前一个
            newKey = newPanes[newPanes.length - 1].key;
          } else {
            // 如果删除的不是最后一个tab，选择当前位置的tab
            newKey = newPanes[targetIndex].key;
          }
          newActiveKey = newKey;
          setActiveKey(newKey);
        }
        setItems(newPanes);
        itemsRef.current = newPanes; // 同步更新ref
        console.log(
          "remove--后: ",
          newPanes,
          itemsRef.current,
          targetIndex,
          newActiveKey
        );
      },
      [activeKey]
    );

    const clickNewWindow = useCallback(
      async (
        action: "log" | "ssh",
        key: string,
        name: string,
        namespace: string
      ) => {
        let url = "";
        let label = "";
        console.log("clickNewWindow--", itemsRef.current, key, name, namespace);

        if (action === "log") {
          url = `/log/${name}/${namespace}`;
          label = `${name}_log`;
        } else if (action === "ssh") {
          url = `/terminal/${name}/${namespace}`;
          label = `${name}_terminal`;
        }
        try {
          await createWindow({
            label: label,
            title: label,
            url: url,
            x: 600,
            y: 800,
            width: 1000,
            height: 640,
          });
          // 确保窗口创建成功后再移除tab
          remove(key);
        } catch (error) {
          console.error("Failed to create window:", error);
          // 如果窗口创建失败，不移除tab
        }
      },
      [remove]
    );

    useImperativeHandle(ref, () => ({
      add,
    }));
    const add = (
      action: "ssh" | "log" | "empty",
      name: string,
      namespace: string,
      container?: string
    ) => {
      console.log("add--", action, name, namespace);
      const newActiveKey = `tab-${newTabIndex.current++}`;
      const newPanes = [...(itemsRef.current || [])];
      if (action === "log") {
        newPanes.push({
          label: (
            <span>
              {name}{" "}
              <MyIcon
                type="icon-xinchuangkou"
                size={11}
                onClick={() => {
                  console.log("onClick", newActiveKey, name, namespace);
                  clickNewWindow("log", newActiveKey, name, namespace);
                }}
              />
            </span>
          ),
          children: <Log name={name} namespace={namespace} />,
          key: newActiveKey,
          icon: <MyIcon type="icon-log1" />,
        });
      } else if (action === "empty") {
        newPanes.push({
          label: name,
          children: "content",
          key: newActiveKey,
          icon: <AndroidOutlined />,
        });
      } else if (action === "ssh") {
        newPanes.push({
          label: (
            <span>
              {name}{" "}
              <MyIcon
                type="icon-xinchuangkou"
                size={11}
                onClick={() =>
                  clickNewWindow("ssh", newActiveKey, name, namespace)
                }
              />
            </span>
          ),
          children: (
            <TerminalWindow
              podName={name}
              namespace={namespace}
              container={container}
            />
          ),
          key: newActiveKey,
          icon: <MyIcon type="icon-terminal1" />,
        });
      }
      setItems(newPanes);
      setActiveKey(newActiveKey);
      itemsRef.current = newPanes;
      console.log("add--", newPanes, itemsRef.current, newActiveKey);
    };

    const onChange = (newActiveKey: string) => {
      setActiveKey(newActiveKey);
    };

    const onEdit = (targetKey: TargetKey, action: "add" | "remove") => {
      if (action === "add") {
        add("empty", "", "");
      } else {
        remove(targetKey);
      }
    };
    const OperationsSlot: Record<"right", React.ReactNode> = {
      right: <div style={{ width: "50px" }} />,
    };
    return (
      <Tabs
        tabBarExtraContent={OperationsSlot}
        type="editable-card"
        onEdit={onEdit}
        size="small"
        onChange={onChange}
        activeKey={activeKey}
        items={items}
        style={{
          width: "100%",
        }}
        hideAdd
      />
    );
  }
);

export default CustomFooter;
