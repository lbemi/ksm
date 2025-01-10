import { FC, useEffect, useState } from "react";
import MyTable, { MyTableProps } from "../MyTable";
import { Splitter } from "antd";
import "./index.scss";
import { Outlet } from "react-router-dom";

interface CustomContentProps extends MyTableProps<any> {
  children?: React.ReactNode;
}

const CustomContent: FC<CustomContentProps> = ({
  children,
  ...tableParams
}) => {
  const [tableHeight, setTableHeight] = useState<number>(0);
  const [localHeight, setLocalHeight] = useState<number>(0);

  // todo 需要优化
  const calculateTableHeight = (splitterHeight?: number) => {
    const headerHeight = 90;
    let padding = 100;

    if (splitterHeight) {
      if (localHeight === 0) {
        padding = padding + 50;
      }
      const height = Math.max(splitterHeight - padding, 0);
      setTableHeight(height);
      return;
    }

    const windowHeight = window.innerHeight;
    const height = Math.max(windowHeight - headerHeight - padding, 0);
    setTableHeight(height);
  };

  useEffect(() => {
    calculateTableHeight();
  }, [window.innerHeight, window.innerWidth]);

  return (
    <div style={{ overflow: "hidden" }}>
      <Splitter
        layout="vertical"
        className="custom-splitter"
        style={{ overflow: "hidden" }}
        onResizeEnd={(sizes) => {
          calculateTableHeight(sizes[0]);
          if (sizes[1] === 0) {
            setLocalHeight(sizes[1] + 100);
          } else {
            setLocalHeight(sizes[1]);
          }
        }}
      >
        <Splitter.Panel className="custom-splitter-panel">
          <MyTable
            {...tableParams}
            scroll={{ x: "max-content", y: tableHeight }}
          />
        </Splitter.Panel>
        <Splitter.Panel
          collapsible
          className="custom-splitter-panel"
          defaultSize={"34px"}
          style={{
            minHeight: "34px",
          }}
        >
          {children}
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default CustomContent;
