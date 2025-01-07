import { FC, useEffect, useState } from "react";
import MyTable, { MyTableProps } from "../MyTable";
import CustomFooter from "../Footer";
import { Splitter } from "antd";
import "./index.scss";

const CustomContent: FC<MyTableProps<any>> = (tableParams) => {
  const [tableHeight, setTableHeight] = useState<number>(0);

  const calculateTableHeight = (splitterHeight?: number) => {
    const headerHeight = 60;
    const breadcrumbHeight = 32;
    const padding = 108;

    // 如果有 splitterHeight，直接使用它减去 padding
    if (splitterHeight) {
      const height = Math.max(splitterHeight - padding, 0); // 确保高度不会为负数
      setTableHeight(height);
      return;
    }

    // 否则使用窗口高度计算
    const windowHeight = window.innerHeight;
    const height = Math.max(
      windowHeight - headerHeight - breadcrumbHeight - padding,
      0
    );
    setTableHeight(height);
  };

  useEffect(() => {
    calculateTableHeight(); // 初始计算

    const handleResize = () => calculateTableHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [window.innerHeight]);

  return (
    <div style={{ overflow: "hidden" }}>
      <Splitter
        layout="vertical"
        className="custom-splitter"
        onResizeEnd={(sizes) => {
          calculateTableHeight(sizes[0]); // 使用第一个面板的高度
        }}
      >
        <Splitter.Panel>
          <MyTable
            {...tableParams}
            scroll={{ x: "max-content", y: tableHeight }}
          />
        </Splitter.Panel>
        <Splitter.Panel
          className="custom-splitter-panel"
          collapsible
          defaultSize={"34px"}
          min="20%"
          style={{ minHeight: "34px" }}
        >
          <CustomFooter />
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default CustomContent;
