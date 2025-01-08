import { FC, useEffect, useState } from "react";
import MyTable, { MyTableProps } from "../MyTable";
import CustomFooter from "../Footer";
import { Splitter } from "antd";
import "./index.scss";

const CustomContent: FC<MyTableProps<any>> = (tableParams) => {
  const [tableHeight, setTableHeight] = useState<number>(0);
  const [localHeight, setLocalHeight] = useState<number>(0);

  const calculateTableHeight = (splitterHeight?: number) => {
    const headerHeight = 90;
    const padding = 90;

    if (splitterHeight) {
      const height = Math.max(splitterHeight - padding, 0);
      setTableHeight(height);
      return;
    }
    console.log("计算tableHeight-------");

    const windowHeight = window.innerHeight;
    const height = Math.max(
      windowHeight - headerHeight - padding - localHeight,
      0
    );
    setTableHeight(height);
  };

  useEffect(() => {
    console.log(
      "监听到窗口发生变动了: window.innerHeight: ",
      window.innerHeight,
      window.innerWidth
    );
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
          setLocalHeight(sizes[1]);
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
          defaultSize={34}
          style={{
            minHeight: "34px",
          }}
        >
          <CustomFooter />
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default CustomContent;
