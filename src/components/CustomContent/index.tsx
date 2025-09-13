import { FC, useEffect, useState } from "react";
import MyTable, { MyTableProps } from "../MyTable";
import { Splitter } from "antd";
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

  const [sizes, setSizes] = useState<number>(0);
  return (
    <Splitter
      style={{ height: "100%" }}
      layout="vertical"
      onResizeEnd={(sizes) => {
        setSizes(sizes[1]);
      }}
    >
      <Splitter.Panel style={{ overflow: "hidden" }}>
        <MyTable
          {...tableParams}
          scroll={{ y: `calc(100vh - ${sizes}px - 140px)` }}
        />
      </Splitter.Panel>
      <Splitter.Panel style={{ overflow: "hidden" }}>{children}</Splitter.Panel>
    </Splitter>
  );
};

export default CustomContent;
