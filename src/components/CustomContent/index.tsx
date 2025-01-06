import { FC, useEffect, useState } from "react";
import MyTable, { MyTableProps } from "../MyTable";
import CustomFooter from "../Footer";
import { Splitter } from "antd";

const CustomContent: FC<MyTableProps<any>> = (tableParams) => {
  const [y, setY] = useState(800);

  useEffect(() => {
    const event = new CustomEvent("splitterResize", { detail: y });
    window.dispatchEvent(event);
  }, [y, window.innerHeight]);
  return (
    <div style={{ overflow: "hidden" }}>
      <Splitter
        layout="vertical"
        style={{
          height: "calc(100vh - 100px)",
          //   boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
          // backgroundColor: "transparent",
        }}
        onResizeEnd={(e) => {
          setY(e[1]);
          console.log("e: ", e);
        }}
      >
        <Splitter.Panel>
          <MyTable {...tableParams} />
        </Splitter.Panel>
        <Splitter.Panel
          collapsible
          defaultSize={"70px"}
          min="20%"
          style={{ minHeight: "70px" }}
        >
          <CustomFooter />
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default CustomContent;
