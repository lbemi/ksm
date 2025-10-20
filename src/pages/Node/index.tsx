import { FC, useEffect, useState, useCallback } from "react";
import {
  Badge,
  Button,
  Dropdown,
  Space,
  TableProps,
  Typography,
  message,
  Modal,
  Tag,
  Form,
  Input,
  Select,
} from "antd";
import {
  DownOutlined,
  EyeOutlined,
  SettingOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
  TagOutlined,
} from "@ant-design/icons";

// Kubernetes models
import { Node } from "kubernetes-models/v1";

// Local imports
import { useLocale } from "@/locales";
import getAge from "@/utils/k8s/date";
import MyTable from "@/components/MyTable";
import {
  listNodes,
  cordonNode,
  uncordonNode,
  drainNode,
  addTaint,
  Taint,
} from "@/api/node";
import NodeDetailDrawer from "./Detail";

const { Text } = Typography;

// Types
interface NodeStatus {
  text: string;
  status: "success" | "processing" | "error" | "warning";
}

// Utility Functions
const getNodeStatus = (node: Node): NodeStatus => {
  const conditions = node.status?.conditions || [];
  const readyCondition = conditions.find((c) => c.type === "Ready");

  if (!readyCondition) {
    return { text: "Unknown", status: "warning" };
  }

  if (readyCondition.status === "True") {
    return { text: "Ready", status: "success" };
  } else if (readyCondition.status === "False") {
    return { text: "Not Ready", status: "error" };
  } else {
    return { text: "Unknown", status: "warning" };
  }
};

const getNodeRoles = (node: Node): string[] => {
  const labels = node.metadata?.labels || {};
  const roles: string[] = [];

  Object.keys(labels).forEach((key) => {
    if (key.startsWith("node-role.kubernetes.io/")) {
      const role = key.replace("node-role.kubernetes.io/", "");
      roles.push(role);
    }
  });

  return roles.length > 0 ? roles : ["worker"];
};

const formatResource = (quantity: string | number | undefined): string => {
  if (!quantity) return "0";
  return String(quantity);
};

const formatResourceMemory = (
  quantity: string | number | undefined
): string => {
  if (!quantity) return "0";
  if (typeof quantity === "string" && quantity.endsWith("Ki")) {
    return (Number(quantity.replace("Ki", "")) / 1024 / 1024).toFixed(2) + "GB";
  }
  if (typeof quantity === "string" && quantity.endsWith("Mi")) {
    return (Number(quantity.replace("Mi", "")) / 1024).toFixed(2) + "GB";
  }
  if (typeof quantity === "string" && quantity.endsWith("Gi")) {
    return quantity;
  }
  return String(quantity);
};
const getNodeCapacity = (node: Node) => {
  const capacity = node.status?.capacity || {};
  return {
    cpu: formatResource(capacity.cpu),
    memory: formatResourceMemory(capacity.memory),
    pods: formatResource(capacity.pods),
  };
};

const getNodeAllocatable = (node: Node) => {
  const allocatable = node.status?.allocatable || {};
  return {
    cpu: formatResource(allocatable.cpu),
    memory: formatResourceMemory(allocatable.memory),
    pods: formatResource(allocatable.pods),
  };
};

const NodePage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<Array<Node>>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [taintModalVisible, setTaintModalVisible] = useState(false);
  const [taintForm] = Form.useForm();
  const { formatMessage } = useLocale();
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [modal, contextHolder] = Modal.useModal();

  const fetchNodes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listNodes();
      setNodes(data);
    } catch (error) {
      messageApi.error("Failed to fetch nodes");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  const filterNodes = useCallback(
    (searchText: string) => {
      if (!searchText) return nodes;
      return nodes.filter((node) => {
        const name = node.metadata?.name || "";
        const status = getNodeStatus(node).text;
        const roles = getNodeRoles(node).join(" ");
        const version = node.status?.nodeInfo?.kubeletVersion || "";
        const os = node.status?.nodeInfo?.operatingSystem || "";
        const arch = node.status?.nodeInfo?.architecture || "";

        const searchLower = searchText.toLowerCase();
        return (
          name.toLowerCase().includes(searchLower) ||
          status.toLowerCase().includes(searchLower) ||
          roles.toLowerCase().includes(searchLower) ||
          version.toLowerCase().includes(searchLower) ||
          os.toLowerCase().includes(searchLower) ||
          arch.toLowerCase().includes(searchLower)
        );
      });
    },
    [nodes]
  );

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const handleShowDetail = useCallback((node: Node) => {
    setSelectedNode(node);
    setDrawerVisible(true);
  }, []);

  const handleCordon = useCallback(
    async (node: Node) => {
      try {
        await cordonNode(node.metadata?.name || "");
        messageApi.success(`Node ${node.metadata?.name} cordoned successfully`);
        fetchNodes();
      } catch (error) {
        console.error("Failed to cordon node:", error);
        messageApi.error("Failed to cordon node");
      }
    },
    [messageApi, fetchNodes]
  );

  const handleUncordon = useCallback(
    async (node: Node) => {
      try {
        await uncordonNode(node.metadata?.name || "");
        messageApi.success(
          `Node ${node.metadata?.name} uncordoned successfully`
        );
        fetchNodes();
      } catch (error) {
        console.error("Failed to uncordon node:", error);
        messageApi.error("Failed to uncordon node");
      }
    },
    [messageApi, fetchNodes]
  );

  const handleDrain = useCallback(
    async (node: Node) => {
      try {
        await drainNode(node.metadata?.name || "");
        messageApi.success(`Node ${node.metadata?.name} drained successfully`);
        fetchNodes();
      } catch (error) {
        console.error("Failed to drain node:", error);
        messageApi.error("Failed to drain node");
      }
    },
    [messageApi, fetchNodes]
  );

  const handleManageTaints = useCallback((node: Node) => {
    setSelectedNode(node);
    setTaintModalVisible(true);
  }, []);

  const handleAddTaint = useCallback(
    async (values: Taint) => {
      if (!selectedNode) return;

      try {
        await addTaint(selectedNode.metadata?.name || "", values);
        messageApi.success(
          `Taint added to node ${selectedNode.metadata?.name} successfully`
        );
        taintForm.resetFields();
        setTaintModalVisible(false);
        fetchNodes();
      } catch (error) {
        messageApi.error("Failed to add taint");
      }
    },
    [selectedNode, messageApi, taintForm, fetchNodes]
  );

  const getActionItems = useCallback(
    (node: Node) => {
      const isUnschedulable = node.spec?.unschedulable;
      const nodeName = node.metadata?.name || "";

      return [
        {
          key: "view",
          label: formatMessage({ id: "table.node_view_details" }),
          icon: <EyeOutlined />,
          onClick: () => handleShowDetail(node),
        },
        {
          key: "cordon",
          label: formatMessage({ id: "table.node_cordon" }),
          icon: <PauseCircleOutlined />,
          onClick: () => handleCordon(node),
          disabled: isUnschedulable,
        },
        {
          key: "uncordon",
          label: formatMessage({ id: "table.node_uncordon" }),
          icon: <PlayCircleOutlined />,
          onClick: () => handleUncordon(node),
          disabled: !isUnschedulable,
        },
        {
          type: "divider" as const,
        },
        {
          key: "taints",
          label: formatMessage({ id: "table.node_taints" }),
          icon: <TagOutlined />,
          onClick: () => handleManageTaints(node),
        },
        {
          type: "divider" as const,
        },
        {
          key: "drain",
          label: formatMessage({ id: "table.node_drain" }),
          icon: <ExclamationCircleOutlined />,
          onClick: () => {
            modal.confirm({
              title: "Drain Node",
              content: `Are you sure you want to drain node ${nodeName}? This will evict all pods from the node.`,
              onOk: () => handleDrain(node),
            });
          },
          danger: true,
        },
      ];
    },
    [
      formatMessage,
      handleShowDetail,
      handleCordon,
      handleUncordon,
      handleDrain,
      handleManageTaints,
      modal,
    ]
  );

  const columns: TableProps<Node>["columns"] = [
    {
      title: formatMessage({ id: "table.name" }),
      dataIndex: ["metadata", "name"],
      key: "name",
      minWidth: 200,
      render: (text, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handleShowDetail(record)}
            className="cursor-pointer"
          >
            {text}
          </Button>
          {record.spec?.unschedulable && (
            <Tag color="orange">
              {formatMessage({ id: "table.node_unschedulable" })}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: formatMessage({ id: "table.node_status" }),
      key: "status",
      align: "center",
      minWidth: 280,
      render: (record: Node) => {
        const { text, status } = getNodeStatus(record);
        return <Badge status={status as any} text={text} />;
      },
    },
    {
      title: formatMessage({ id: "table.node_roles" }),
      key: "roles",
      align: "center",
      minWidth: 150,
      render: (record: Node) => {
        const roles = getNodeRoles(record);
        return (
          <Space wrap>
            {roles.map((role) => (
              <Tag key={role} color="blue">
                {role}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: formatMessage({ id: "table.node_version" }),
      key: "version",
      align: "center",
      minWidth: 120,
      render: (record: Node) => {
        const version = record.status?.nodeInfo?.kubeletVersion || "Unknown";
        return <Text>{version}</Text>;
      },
    },
    {
      title: formatMessage({ id: "table.node_os" }),
      key: "os",
      align: "center",
      minWidth: 120,
      render: (record: Node) => {
        const os = record.status?.nodeInfo?.operatingSystem || "Unknown";
        const arch = record.status?.nodeInfo?.architecture || "Unknown";
        return (
          <Text>
            {os}/{arch}
          </Text>
        );
      },
    },
    {
      title: formatMessage({ id: "table.node_cpu" }),
      key: "cpu",
      align: "center",
      minWidth: 100,
      render: (record: Node) => {
        const capacity = getNodeCapacity(record);
        const allocatable = getNodeAllocatable(record);
        return (
          <div>
            <div>{allocatable.cpu}</div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              / {capacity.cpu}
            </Text>
          </div>
        );
      },
    },
    {
      title: formatMessage({ id: "table.node_memory" }),
      key: "memory",
      align: "center",
      minWidth: 120,
      render: (record: Node) => {
        const capacity = getNodeCapacity(record);
        const allocatable = getNodeAllocatable(record);
        return (
          <div>
            <div>{allocatable.memory}</div>
            <Text type="success">/ {capacity.memory}</Text>
          </div>
        );
      },
    },
    {
      title: formatMessage({ id: "table.node_pods_count" }),
      key: "pods",
      align: "center",
      minWidth: 100,
      render: (record: Node) => {
        const capacity = getNodeCapacity(record);
        const allocatable = getNodeAllocatable(record);
        return (
          <div>
            <div>{allocatable.pods}</div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              / {capacity.pods}
            </Text>
          </div>
        );
      },
    },
    {
      title: formatMessage({ id: "table.age" }),
      key: "age",
      align: "center",
      minWidth: 100,
      render: (record: Node) => {
        const creationTime = record.metadata?.creationTimestamp;
        return creationTime ? getAge(creationTime) : "Unknown";
      },
    },
    {
      title: formatMessage({ id: "table.node_action" }),
      key: "action",
      align: "center",
      minWidth: 100,
      fixed: "right",
      render: (record: Node) => (
        <Dropdown
          menu={{ items: getActionItems(record) }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button type="text" size="small">
            <SettingOutlined />
            <DownOutlined />
          </Button>
        </Dropdown>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      {contextHolderMessage}
      <MyTable
        loading={loading}
        columns={columns}
        refresh={fetchNodes}
        filter={filterNodes}
        total={nodes.length}
        disableNamespace
        del={undefined}
        onCreate={undefined}
      />

      <NodeDetailDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        node={selectedNode}
        onNodeUpdate={fetchNodes}
      />

      <Modal
        title={
          formatMessage({ id: "node.add_taint_title" }) +
          " - " +
          selectedNode?.metadata?.name
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
    </>
  );
};

export default NodePage;
