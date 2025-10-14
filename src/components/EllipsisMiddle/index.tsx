import React from "react";
import { Tooltip, Typography } from "antd";
import { BaseType } from "antd/es/typography/Base";

const { Text } = Typography;

const EllipsisMiddle: React.FC<{
  suffixCount: number;
  children: string;
  endCount?: number;
  copyable?: boolean;
  type?: BaseType;
  onClick?: () => void;
}> = ({ suffixCount, endCount = 10, children, copyable, type, onClick }) => {
  const start = children.slice(0, suffixCount);
  const suffix = children.slice(-endCount).trim();
  return (
    <Tooltip title={children}>
      <Text
        type={type}
        ellipsis={{
          suffix: children.length > suffixCount + endCount ? suffix : "",
        }}
        copyable={copyable ? { text: children } : false}
        onClick={() => onClick?.()}
        style={{ cursor: onClick ? "pointer" : "default" }}
      >
        {children.length > suffixCount + endCount ? start + "..." : children}
      </Text>
    </Tooltip>
  );
};

export default EllipsisMiddle;
