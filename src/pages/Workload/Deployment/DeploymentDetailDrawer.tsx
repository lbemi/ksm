import React from "react";
import {
  Drawer,
  Typography,
  Descriptions,
  Tag,
  Table,
  Space,
  Divider,
  Badge,
} from "antd";
import { Deployment } from "kubernetes-models/apps/v1";
import getAge from "@/utils/k8s/date";

interface DeploymentDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  deployment: Deployment | null;
}

const DeploymentDetailDrawer: React.FC<DeploymentDetailDrawerProps> = ({
  visible,
  onClose,
  deployment,
}) => {
  if (!deployment) return null;

  const { metadata, spec, status } = deployment;

  const containerColumns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "镜像",
      dataIndex: "image",
      key: "image",
      render: (text: string) => (
        <Typography.Text copyable>{text}</Typography.Text>
      ),
    },
    {
      title: "端口",
      dataIndex: "ports",
      key: "ports",
      render: (ports: any[]) => (
        <Space>
          {ports?.map((port, index) => (
            <Tag key={index}>
              {port.containerPort}/{port.protocol}
            </Tag>
          ))}
        </Space>
      ),
    },
  ];

  const getStatusColor = (type: string) => {
    switch (type) {
      case "Available":
        return "success";
      case "Progressing":
        return "processing";
      default:
        return "default";
    }
  };

  return (
    <div>
      <Drawer
        title="Deployment 详情"
        placement="right"
        width={800}
        onClose={onClose}
        open={visible}
        // getContainer={() => document.body}
        style={{
          position: "fixed",
          zIndex: 1001,
          top: 64,
          width: "800px",
          height: "calc(100% - 64px)",
        }}
      >
        <Descriptions title="基本信息" column={2} bordered>
          <Descriptions.Item label="名称">{metadata?.name}</Descriptions.Item>
          <Descriptions.Item label="命名空间">
            {metadata?.namespace}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {metadata?.creationTimestamp && getAge(metadata.creationTimestamp)}
          </Descriptions.Item>
          <Descriptions.Item label="UID">{metadata?.uid}</Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">状态信息</Divider>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="期望副本数">
            {spec?.replicas}
          </Descriptions.Item>
          <Descriptions.Item label="当前副本数">
            {status?.replicas}
          </Descriptions.Item>
          <Descriptions.Item label="就绪副本数">
            {status?.readyReplicas}
          </Descriptions.Item>
          <Descriptions.Item label="更新副本数">
            {status?.updatedReplicas}
          </Descriptions.Item>
          <Descriptions.Item label="可用副本数">
            {status?.availableReplicas}
          </Descriptions.Item>
          <Descriptions.Item label="更新策略">
            {spec?.strategy?.type}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">状态条件</Divider>
        <Space direction="vertical" style={{ width: "100%" }}>
          {status?.conditions?.map((condition, index) => (
            <Badge
              key={index}
              status={getStatusColor(condition.type) as any}
              text={
                <Space>
                  <span>{condition.type}</span>
                  <span>{condition.message}</span>
                  <span>
                    最后更新: {getAge(condition.lastUpdateTime || "")}
                  </span>
                </Space>
              }
            />
          ))}
        </Space>

        <Divider orientation="left">标签</Divider>
        <Space wrap>
          {Object.entries(metadata?.labels || {}).map(([key, value]) => (
            <Tag key={key} color="blue">
              {key}: {value}
            </Tag>
          ))}
        </Space>

        <Divider orientation="left">容器信息</Divider>
        <Table
          columns={containerColumns}
          dataSource={spec?.template?.spec?.containers}
          rowKey="name"
          pagination={false}
        />

        <Divider orientation="left">选择器</Divider>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="matchLabels">
            <Space wrap>
              {Object.entries(spec?.selector?.matchLabels || {}).map(
                ([key, value]) => (
                  <Tag key={key} color="green">
                    {key}: {value}
                  </Tag>
                )
              )}
            </Space>
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">注解</Divider>
        <Descriptions bordered column={1}>
          {Object.entries(metadata?.annotations || {}).map(([key, value]) => (
            <Descriptions.Item key={key} label={key}>
              <Typography.Text copyable>{value}</Typography.Text>
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Drawer>
    </div>
  );
};

export default DeploymentDetailDrawer;
