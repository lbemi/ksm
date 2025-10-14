import { FC, useEffect, useRef, useState, useCallback } from "react";
import MyTable, { MyTableProps } from "../MyTable";
import { Splitter } from "antd";
import "./index.scss";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import MyIcon from "../MyIcon";

interface CustomContentProps extends MyTableProps<any> {
  children?: React.ReactNode;
}

interface PanelSize {
  up: number | string;
  down: number | string;
  tmpHeight: Array<number | string>;
}

const CustomContent: FC<CustomContentProps> = ({
  children,
  ...tableParams
}) => {
  const splitterRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({
    max: false,
    up: false,
  });
  const [panelSize, setPanelSize] = useState<PanelSize>({
    up: "99%",
    down: 32,
    tmpHeight: ["99%", 32],
  });
  // panelHeight用于传递给Log组件，通过setPanelHeight更新
  const [_panelHeight, setPanelHeight] = useState(400);

  // 防抖函数
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // 处理resize事件
  const handleResize = useCallback(() => {
    if (splitterRef.current) {
      const splitterHeight = splitterRef.current.clientHeight;
      const pannelHeight =
        document.getElementsByClassName("ant-splitter-panel");
      const downPanelHeight = pannelHeight.item(1)?.clientHeight || 32;
      setPanelSize((prev) => ({
        ...prev,
        up: pannelHeight.item(0)?.clientHeight || splitterHeight - 32,
        down: downPanelHeight,
      }));
      // 更新panelHeight状态
      setPanelHeight(downPanelHeight);
    }
  }, []);

  // 防抖的resize处理函数
  const debouncedHandleResize = useCallback(debounce(handleResize, 100), [
    handleResize,
    debounce,
  ]);

  // 正确管理resize事件监听器
  useEffect(() => {
    window.addEventListener("resize", debouncedHandleResize);
    return () => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  }, [debouncedHandleResize]);

  const changeDownPanelSize = (max: boolean) => {
    if (splitterRef.current) {
      const splitterHeight = splitterRef.current.clientHeight;
      if (max) {
        setPanelSize((prev) => ({ ...prev, up: 0, down: splitterHeight }));
        setPanelHeight(splitterHeight);
      } else {
        setPanelSize((prev) => ({
          ...prev,
          up: panelSize.tmpHeight[0],
          down: panelSize.tmpHeight[1],
        }));
        setPanelHeight(
          typeof panelSize.tmpHeight[1] === "number"
            ? panelSize.tmpHeight[1]
            : 400
        );
      }
    }
  };
  useEffect(() => {
    if (panelSize.down === 32) {
      setState((prev) => ({ ...prev, up: false }));
    }
  }, [panelSize.down]);

  const up = (up: boolean) => {
    if (up) {
      if (panelSize.down === 32) {
        if (!splitterRef.current) return;
        const splitterHeight = splitterRef.current.clientHeight;
        setPanelSize((prev) => ({
          ...prev,
          up: splitterHeight - 400,
          down: 400,
        }));
        setPanelHeight(400);
      } else {
        setPanelSize((prev) => ({
          ...prev,
          up: panelSize.tmpHeight[0],
          down: panelSize.tmpHeight[1],
        }));
        setPanelHeight(
          typeof panelSize.tmpHeight[1] === "number"
            ? panelSize.tmpHeight[1]
            : 400
        );
      }
    } else {
      if (!splitterRef.current) return;
      const splitterHeight = splitterRef.current.clientHeight;
      setPanelSize((prev) => ({
        ...prev,
        up: splitterHeight - 32,
        down: 32,
      }));
      setPanelHeight(32);
    }
  };

  return (
    <div ref={splitterRef}>
      <Splitter
        lazy
        style={{ height: "calc(100vh - 35px)", display: "flex" }}
        layout="vertical"
        onResizeEnd={(sizes) => {
          if (sizes[1] > 32) {
            setState((prev) => ({ ...prev, up: true }));
          }
          setPanelSize({ up: sizes[0], down: sizes[1], tmpHeight: sizes });
          // 更新panelHeight状态
          setPanelHeight(sizes[1]);
        }}
      >
        <Splitter.Panel style={{ overflow: "hidden" }} size={panelSize.up}>
          <MyTable
            {...tableParams}
            scroll={{ y: `calc(100vh - ${panelSize.down}px - 130px)` }}
            key={`table-${panelSize.up}-${panelSize.down}`}
          />
        </Splitter.Panel>
        <Splitter.Panel
          defaultSize={32}
          size={panelSize.down}
          min={32}
          style={{ overflow: "hidden", position: "relative" }}
        >
          <div className="flex items-center justify-between absolute top-2 right-4 z-10 gap-2">
            {state.max ? (
              <MyIcon
                type="icon-suoxiao"
                size={11}
                onClick={() => {
                  changeDownPanelSize(false);
                  setState((prev) => ({ ...prev, max: false }));
                }}
              />
            ) : (
              <MyIcon
                type="icon-fangda"
                size={10}
                onClick={() => {
                  changeDownPanelSize(true);
                  setState({ up: true, max: true });
                }}
              />
            )}
            {state.up ? (
              <DownOutlined
                size={14}
                onClick={() => {
                  up(false);
                  setState({ max: false, up: false });
                }}
              />
            ) : (
              <UpOutlined
                size={15}
                onClick={() => {
                  up(true);
                  setState((prev) => ({ ...prev, up: true }));
                }}
              />
            )}
          </div>
          <div>{children}</div>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default CustomContent;
