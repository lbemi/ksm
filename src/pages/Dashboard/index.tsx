import React from "react";
import { Flex, Splitter, Typography } from "antd";
import type { SplitterProps } from "antd";
import { useLocale } from "@/locales";

const Desc: React.FC<Readonly<{ text?: string | number }>> = (props) => (
  <Flex justify="center" align="center" style={{ height: "100%" }}>
    <Typography.Title
      type="secondary"
      level={5}
      style={{ whiteSpace: "nowrap" }}
    >
      {props.text}
    </Typography.Title>
  </Flex>
);

const CustomSplitter: React.FC<Readonly<SplitterProps>> = ({
  style,
  ...restProps
}) => {
  const { formatMessage } = useLocale();
  return (
    <Splitter
      style={{ boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)", ...style }}
      {...restProps}
    >
      <Splitter.Panel collapsible min="20%">
        <Desc text="First" />
        <div className="bg-amber-400 ml-2.5"> AAAA</div>
        {formatMessage({ id: "menu.workload" })}
      </Splitter.Panel>
      <Splitter.Panel collapsible>
        <Desc text="Second" />
      </Splitter.Panel>
    </Splitter>
  );
};

const Dashboard: React.FC = () => (
  <Flex gap="large" vertical>
    <CustomSplitter style={{ height: "100%" }} layout="vertical" />
  </Flex>
);

export default Dashboard;
