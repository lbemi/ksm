import { FC, useEffect, useState } from "react";
import MyTable, { MyTableProps } from "../MyTable";
import { Splitter, SplitterProps } from "antd";
import "./index.scss";

interface CustomContentProps extends MyTableProps<any> {
  children?: React.ReactNode;
}

const CustomContent: FC<CustomContentProps> = ({
  children,
  ...tableParams
}) => {
  const [tableHeight, setTableHeight] = useState<number | string>("100%");

  const calculateTableHeight = () => {
    // 以父容器高度为基准，减去Splitter面板/其他padding等
    const container = document.querySelector(".ant-splitter-panel");
    if (container) {
      // 你可以根据实际布局调整减去的高度
      const height = container.clientHeight - 80; // 80为预留高度
      setTableHeight(height > 0 ? height : "100%");
    }
  };

  useEffect(() => {
    calculateTableHeight(); // 初始计算
    window.addEventListener("resize", calculateTableHeight);
    return () => window.removeEventListener("resize", calculateTableHeight);
  }, []);

  return (
    <div style={{ overflow: "hidden" }}>
      <Splitter
        style={{ boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)", height: "92vh" }}
        layout="vertical"
        onResizeEnd={(sizes) => {
          setTableHeight(sizes[0] - 80);
        }}
      >
        <Splitter.Panel className="custom-splitter-panel">
          <MyTable
            {...tableParams}
            scroll={{ x: "max-content", y: tableHeight }}
          />
        </Splitter.Panel>
        <Splitter.Panel max="70%" collapsible defaultSize={"34px"}>
          {children}
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default CustomContent;
