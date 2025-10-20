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
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

// Kubernetes types
import { Node } from "kubernetes-models/v1";

// Utils and hooks
import getAge, { dateFormat } from "@/utils/k8s/date";
import { useLocale } from "@/locales";
import { addTaint, removeTaint, Taint } from "@/api/node";

const { Text } = Typography;

interface NodeDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  node: Node | null;
  onNodeUpdate?: () => void;
}

const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  visible,
  onClose,
  node,
  onNodeUpdate,
}) => {
  const { formatMessage } = useLocale();
  const [taintModalVisible, setTaintModalVisible] = React.useState(false);
  const [taintForm] = Form.useForm();
  const [messageApi, contextHolderMessage] = message.useMessage();
  if (!node) return null;

  const metadata = node.metadata || {};
  const spec = node.spec || {};
  const status = node.status || {};
  const nodeInfo = status.nodeInfo || {};
  const conditions = status.conditions || [];
  const capacity = status.capacity || {};
  const allocatable = status.allocatable || {};
  const taints = spec.taints || [];

  const getConditionIcon = (status: string, type: string) => {
    if (status === "True") {
      if (type === "Ready") {
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      } else {
        return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
      }
    } else if (status === "False") {
      if (type === "Ready") {
        return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
      } else {
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      }
    } else {
      return <QuestionCircleOutlined style={{ color: "#faad14" }} />;
    }
  };

  const getConditionStatus = (status: string, type: string) => {
    if (status === "True") {
      if (type === "Ready") {
        return "success";
      } else {
        return "error";
      }
    } else if (status === "False") {
      if (type === "Ready") {
        return "error";
      } else {
        return "success";
      }
    } else {
      return "warning";
    }
  };

  const formatResource = (quantity: string | number | undefined): string => {
    if (!quantity) return "0";
    return String(quantity);
  };

  const getNodeRoles = (): string[] => {
    const labels = metadata.labels || {};
    const roles: string[] = [];

    Object.keys(labels).forEach((key) => {
      if (key.startsWith("node-role.kubernetes.io/")) {
        const role = key.replace("node-role.kubernetes.io/", "");
        roles.push(role);
      }
    });

    return roles.length > 0 ? roles : ["worker"];
  };

  const handleAddTaint = async (values: Taint) => {
    if (!node) return;

    try {
      await addTaint(node.metadata?.name || "", values);
      onNodeUpdate?.();
      taintForm.resetFields();
      setTaintModalVisible(false);
    } catch (error) {
      messageApi.error(formatMessage({ id: "node.add_taint_failed" }));
    }
  };

  const handleRemoveTaint = async (taintKey: string) => {
    if (!node) return;

    try {
      await removeTaint(node.metadata?.name || "", taintKey);
      onNodeUpdate?.();
    } catch (error) {
      console.error("Failed to remove taint:", error);
    }
  };

  const conditionsColumns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: any) => {
        return (
          <Space>
            {getConditionIcon(status, record.type)}
            <Badge
              status={getConditionStatus(status, record.type) as any}
              text={status}
            />
          </Space>
        );
      },
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      render: (text: string) => text || "-",
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 200 }}>
          {text || "-"}
        </Text>
      ),
    },
    {
      title: "Last Transition Time",
      dataIndex: "lastTransitionTime",
      key: "lastTransitionTime",
      render: (text: string) => (text ? dateFormat(text) : "-"),
    },
  ];

  const taintsColumns = [
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (text: string) => text || "-",
    },
    {
      title: "Effect",
      dataIndex: "effect",
      key: "effect",
      render: (text: string) => {
        const color =
          text === "NoSchedule"
            ? "red"
            : text === "PreferNoSchedule"
              ? "orange"
              : "blue";
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_: any, record: any) => (
        <Popconfirm
          title={formatMessage({ id: "node.remove_taint_content" })}
          onConfirm={() => handleRemoveTaint(record.key)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Drawer
      title={`Node Details: ${metadata.name}`}
      placement="right"
      width={"80%"}
      onClose={onClose}
      open={visible}
    >
      {contextHolderMessage}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Divider orientation="left" style={{ marginTop: 0 }}>
            {formatMessage({ id: "table.basic" })}
          </Divider>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Name">
              <Text code>{metadata.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="UID">
              <Text code>{metadata.uid}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Creation Time">
              {metadata.creationTimestamp
                ? dateFormat(metadata.creationTimestamp)
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Age">
              {metadata.creationTimestamp
                ? getAge(metadata.creationTimestamp)
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Roles">
              <Space wrap>
                {getNodeRoles().map((role) => (
                  <Tag key={role} color="blue">
                    {role}
                  </Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Unschedulable">
              <Tag color={spec.unschedulable ? "red" : "green"}>
                {spec.unschedulable ? "Yes" : "No"}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Col>

        <Col span={24}>
          <Divider orientation="left">
            {formatMessage({ id: "table.node_os" })}
          </Divider>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Operating System">
              {(nodeInfo as any).operatingSystem || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Architecture">
              {(nodeInfo as any).architecture || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="OS Image">
              {(nodeInfo as any).osImage || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Kernel Version">
              {(nodeInfo as any).kernelVersion || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Container Runtime">
              {(nodeInfo as any).containerRuntimeVersion || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Kubelet Version">
              {(nodeInfo as any).kubeletVersion || "-"}
            </Descriptions.Item>
          </Descriptions>
        </Col>

        <Col span={24}>
          <Divider orientation="left">
            {formatMessage({ id: "table.node_capacity" })}
          </Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="CPU"
                  value={formatResource(capacity.cpu)}
                  suffix="cores"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="Memory"
                  value={formatResource(capacity.memory)}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic title="Pods" value={formatResource(capacity.pods)} />
              </Card>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Divider orientation="left">
            {formatMessage({ id: "table.node_allocatable" })}
          </Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="CPU"
                  value={formatResource(allocatable.cpu)}
                  suffix="cores"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="Memory"
                  value={formatResource(allocatable.memory)}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="Pods"
                  value={formatResource(allocatable.pods)}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Divider orientation="left">
            {formatMessage({ id: "table.node_conditions" })}
          </Divider>
          <Table
            size="small"
            columns={conditionsColumns}
            dataSource={conditions}
            rowKey="type"
            pagination={false}
            scroll={{ y: 200 }}
          />
        </Col>

        <Col span={24}>
          <Divider orientation="left">
            <Space>
              {formatMessage({ id: "table.node_taints" })}
              <Button
                type="link"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setTaintModalVisible(true)}
              >
                {formatMessage({ id: "node.add_taint" })}
              </Button>
            </Space>
          </Divider>
          <Table
            size="small"
            columns={taintsColumns}
            dataSource={taints}
            rowKey="key"
            pagination={false}
            locale={{ emptyText: "No taints" }}
          />
        </Col>

        <Col span={24}>
          <Divider orientation="left">
            {formatMessage({ id: "table.labels" })}
          </Divider>
          <Space wrap>
            {Object.entries(metadata.labels || {}).map(([key, value]) => (
              <Tag key={key} color="blue">
                {key}: {value}
              </Tag>
            ))}
          </Space>
        </Col>

        <Col span={24}>
          <Divider orientation="left">
            {formatMessage({ id: "table.annotations" })}
          </Divider>
          <Space wrap>
            {Object.entries(metadata.annotations || {}).map(([key, value]) => (
              <Tag key={key} color="green">
                {key}: {value}
              </Tag>
            ))}
          </Space>
        </Col>
      </Row>

      <Modal
        title={
          formatMessage({ id: "node.add_taint_title" }) + " - " + metadata.name
        }
        open={taintModalVisible}
        onCancel={() => {
          setTaintModalVisible(false);
          taintForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={taintForm} layout="vertical" onFinish={handleAddTaint}>
          <Form.Item
            label={formatMessage({ id: "node.add_taint_key" })}
            name="key"
            rules={[{ required: true, message: "Please input taint key" }]}
          >
            <Input placeholder="Enter taint key" />
          </Form.Item>

          <Form.Item
            label={formatMessage({ id: "node.add_taint_effect" })}
            name="effect"
            rules={[{ required: true, message: "Please select taint effect" }]}
          >
            <Select
              placeholder={formatMessage({
                id: "node.add_taint_effect_select_placeholder",
              })}
            >
              <Select.Option value="NoSchedule">NoSchedule</Select.Option>
              <Select.Option value="PreferNoSchedule">
                PreferNoSchedule
              </Select.Option>
              <Select.Option value="NoExecute">NoExecute</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label={formatMessage({ id: "node.add_taint_value" })}
            name="value"
          >
            <Input placeholder="Enter taint value (optional)" />
          </Form.Item>
        </Form>
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => taintForm.submit()}
          >
            {formatMessage({ id: "button.confirm" })}
          </Button>
          <Button
            size="small"
            onClick={() => {
              setTaintModalVisible(false);
              taintForm.resetFields();
            }}
          >
            {formatMessage({ id: "button.cancel" })}
          </Button>
        </Space>
      </Modal>
    </Drawer>
  );
};

export default NodeDetailDrawer;
