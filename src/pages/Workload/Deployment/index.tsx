// React imports
import { FC, useEffect, useRef, useState } from "react";

// Antd imports
import {
  Badge,
  Button,
  Dropdown,
  InputNumber,
  Modal,
  Progress,
  TableProps,
  Typography,
  message,
} from "antd";
import Link from "antd/es/typography/Link";
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EyeOutlined,
  SettingOutlined,
} from "@ant-design/icons";

// Kubernetes models
import { Deployment } from "kubernetes-models/apps/v1";
import { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from "@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta";

// Local imports
import { useAppSelector } from "@/store/hook";
import { useLocale } from "@/locales";
import getAge from "@/utils/k8s/date";
import MyTable from "@/components/MyTable";
import DeploymentDetailDrawer from "./Detail";
import {
  deleteDeployment,
  listDeployment,
  scaleDeployment,
} from "@/api/deployment";

// Constants
const { Text } = Typography;

// Types
interface DeploymentStatus {
  text: string;
  status: "success" | "processing" | "error" | "warning";
}

// Utility Functions
const getDeploymentStatus = (deployment: Deployment): DeploymentStatus => {
  const status = deployment.status;
  if (!status) return { text: "Unknown", status: "error" };

  const { replicas = 0, availableReplicas = 0 } = status;
  const desiredReplicas = deployment.spec?.replicas || 0;

  // Updating status
  if (
    replicas > availableReplicas ||
    (replicas > desiredReplicas && availableReplicas)
  ) {
    return { text: "Updating", status: "processing" };
  }

  // Running status
  if (
    desiredReplicas === 0 ||
    (availableReplicas && availableReplicas === desiredReplicas)
  ) {
    return { text: "Running", status: "success" };
  }

  return { text: "Waiting", status: "warning" };
};

const filterDeployments = (
  deployments: Deployment[],
  searchText: string
): Deployment[] => {
  try {
    if (searchText === "" || typeof searchText !== "string") return deployments;

    return deployments.filter((deployment) => {
      const name = deployment.metadata?.name?.toLowerCase() || "";
      const namespace = deployment.metadata?.namespace?.toLowerCase() || "";
      const searchLower = searchText.toLowerCase();

      return name.includes(searchLower) || namespace.includes(searchLower);
    });
  } catch (error) {
    return deployments;
  }
};

const DeploymentPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [deployments, setDeployments] = useState<Array<Deployment>>([]);
  const [selectedDeployment, setSelectedDeployment] =
    useState<Deployment | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { formatMessage } = useLocale();
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [modal, contextHolder] = Modal.useModal();
  const scaleReplicas = useRef<number>(0);

  const columns: TableProps<Deployment>["columns"] = [
    {
      title: formatMessage({ id: "deployment.name" }),
      dataIndex: ["metadata", "name"],
      key: "name",
      fixed: "left",
      width: 250,
      onCell: () => {
        return {
          style: {
            maxWidth: 250,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            cursor: "pointer",
          },
        };
      },
      render: (text, record) => (
        <Text ellipsis={{ tooltip: `${text}` }}>
          <Link onClick={() => handleShowDetail(record)}>{text}</Link>
        </Text>
      ),
    },
    ...(namespace === "all"
      ? [
          {
            title: formatMessage({ id: "deployment.namespace" }),
            align: "center" as const,
            dataIndex: ["metadata", "namespace"],
            key: "namespace",
            render: (text: string) => <div>{text}</div>,
          },
        ]
      : []),
    {
      title: formatMessage({ id: "deployment.status" }),
      key: "status",
      align: "center",
      render: (record: Deployment) => {
        const { text, status } = getDeploymentStatus(record);
        return <Badge status={status as any} text={text} />;
      },
    },
    {
      title: formatMessage({ id: "deployment.replicas" }),
      dataIndex: ["spec", "replicas"],
      key: "replicas",
      align: "center",
      render: (_, record: Deployment) => {
        const replicas = record.status?.replicas || 0;
        const readyReplicas = record.status?.readyReplicas || 0;
        const isHealthy = replicas === readyReplicas;

        return (
          <div className="flex items-center justify-center">
            <Progress
              size={[50, 8]}
              percent={(readyReplicas / replicas) * 100}
              showInfo={false}
              style={{ width: "60px" }}
            />
            <span style={{ color: isHealthy ? "inherit" : "red" }}>
              {readyReplicas}
            </span>
            {`/${replicas}`}
          </div>
        );
      },
    },
    {
      title: formatMessage({ id: "deployment.age" }),
      dataIndex: "metadata",
      align: "center",
      key: "creationTimestamp",
      render: (metadata: IIoK8sApimachineryPkgApisMetaV1ObjectMeta) => {
        if (metadata.creationTimestamp) {
          return getAge(metadata.creationTimestamp);
        } else {
          return "-";
        }
      },
    },
    {
      title: formatMessage({ id: "button.action" }),
      key: "action",
      fixed: "right",
      dataIndex: "action",
      align: "center",
      width: 100,
      render: (_, record: Deployment) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "detail",
                label: formatMessage({ id: "button.detail" }),
                icon: <EyeOutlined />,
                onClick: () => handleShowDetail(record),
              },
              {
                key: "edit",
                label: formatMessage({ id: "button.edit" }),
                icon: <EditOutlined />,
              },
              {
                key: "delete",
                label: formatMessage({ id: "button.delete" }),
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDeleteDeployment(record),
              },
              { type: "divider" },
              {
                key: "scale",
                label: formatMessage({ id: "button.scale" }),
                icon: <SettingOutlined />,
                onClick: () => handleScale(record),
              },
            ],
          }}
        >
          <Button type="link" size="small" className="pr-0">
            {formatMessage({ id: "button.more" })}
            <DownOutlined />
          </Button>
        </Dropdown>
      ),
    },
  ];
  // Event Handlers
  const handleShowDetail = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setDrawerVisible(true);
  };

  const handleScale = (deployment: Deployment) => {
    scaleReplicas.current = deployment.spec?.replicas || 0;
    modal.confirm({
      title: formatMessage({ id: "button.scale" }),
      content: (
        <div className="flex items-center gap-2 justify-center">
          <InputNumber
            addonBefore={formatMessage({ id: "deployment.replicas" })}
            defaultValue={scaleReplicas.current}
            min={0}
            style={{ width: 150 }}
            size="small"
            onChange={(value) => (scaleReplicas.current = value || 0)}
          />
        </div>
      ),
      okText: formatMessage({ id: "button.confirm" }),
      cancelText: formatMessage({ id: "button.cancel" }),
      okButtonProps: { size: "small" },
      cancelButtonProps: { size: "small" },
      onOk: async () => {
        try {
          await scaleDeployment(
            deployment.metadata?.name!,
            scaleReplicas.current,
            deployment.metadata?.namespace
          );
          messageApi.success(formatMessage({ id: "message.success" }));
          await fetchDeployments();
        } catch (error) {
          messageApi.error(`${formatMessage({ id: "message.error" })}`);
        }
      },
    });
  };

  const handleDeleteDeployment = (deployment: Deployment) => {
    modal.confirm({
      title: formatMessage({ id: "button.confirm" }),
      content: (
        <span>
          {formatMessage({ id: "button.confirm_delete" })} Deployment{" "}
          <span style={{ color: "red" }}>{deployment.metadata?.name}</span> ?
        </span>
      ),
      okText: formatMessage({ id: "button.confirm" }),
      cancelText: formatMessage({ id: "button.cancel" }),
      okButtonProps: { size: "small" },
      cancelButtonProps: { size: "small" },
      onOk: async () => {
        try {
          await deleteDeployment(
            deployment.metadata?.name!,
            deployment.metadata?.namespace
          );
          messageApi.success(
            `${formatMessage({ id: "button.delete_success" })} ${deployment.metadata?.name}`
          );
          await fetchDeployments();
        } catch (error) {
          messageApi.error(
            `${formatMessage({ id: "button.delete_failed" })} ${error}`
          );
        }
      },
    });
  };

  // Data Fetching
  const fetchDeployments = async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }

    try {
      const deploymentList = await listDeployment(namespace);
      setDeployments(deploymentList);
    } catch (error) {
      messageApi.error(
        `${formatMessage({ id: "button.get_failed" })} ${error}`
      );
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  };

  // Effects
  useEffect(() => {
    fetchDeployments();
    const interval = setInterval(async () => {
      await fetchDeployments(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [namespace]);

  // Filter function for table
  const handleFilterDeployments = (searchText: string): Deployment[] => {
    return filterDeployments(deployments, searchText);
  };
  // Render
  return (
    <>
      <MyTable
        loading={loading}
        columns={columns}
        refresh={fetchDeployments}
        del={() => {}} // TODO: Implement bulk delete functionality
        filter={handleFilterDeployments}
        total={deployments.length}
      />

      <DeploymentDetailDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        name={selectedDeployment?.metadata?.name || ""}
        namespace={selectedDeployment?.metadata?.namespace || ""}
      />

      {/* Modal and Message contexts */}
      {contextHolderMessage}
      {contextHolder}
    </>
  );
};

export default DeploymentPage;
