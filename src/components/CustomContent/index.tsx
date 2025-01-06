import { FC } from "react";
import MyTable, { MyTableProps } from "../MyTable";
import CustomFooter from "../Footer";
import { Splitter } from "antd";

const CustomContent: FC<MyTableProps<any>> = (tableParams) => {
  return (
    <div>
      <Splitter
        layout="vertical"
        style={{
          height: "calc(100vh - 100px)",
          //   boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
          backgroundColor: "transparent",
        }}
        onResizeEnd={(e) => {
          console.log(e);
        }}
      >
        <Splitter.Panel>
          <MyTable {...tableParams} />
        </Splitter.Panel>
        <Splitter.Panel collapsible min="20%" style={{ minHeight: "70px" }}>
          <CustomFooter />
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default CustomContent;
