import { useAppSelector } from "@/store/hook";
import {
  Button,
  TableProps,
  Dropdown,
  Modal,
  message,
  Progress,
  Badge,
} from "antd";
import { FC, useEffect, useState } from "react";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";

import { Typography } from "antd";
import { Deployment } from "kubernetes-models/apps/v1";
import { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from "@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta";
import getAge from "@/utils/k8s/date";
import DeploymentDetailDrawer from "./Detail";
import MyTable from "@/components/MyTable";
import { deleteDeployment, listDeployment } from "@/api/deployment";
import Link from "antd/es/typography/Link";
import { useLocale } from "@/locales";

const { Text } = Typography;
const DeploymentPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [deployments, setDeployments] = useState<Array<Deployment>>([]);
  const [selectedDeployment, setSelectedDeployment] =
    useState<Deployment | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { formatMessage } = useLocale();
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
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
    namespace === "all"
      ? {
          title: formatMessage({ id: "deployment.namespace" }),
          align: "center",
          dataIndex: ["metadata", "namespace"],
          key: "namespace",
          render: (text: string) => <div>{text}</div>,
        }
      : {},
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
        const desiredReplicas = record.spec?.replicas || 0;
        const readyReplicas = record.status?.readyReplicas || 0;
        const isHealthy = desiredReplicas === readyReplicas;

        return (
          <div className="flex items-center justify-center">
            <Progress
              size={[50, 8]}
              percent={(readyReplicas / desiredReplicas) * 100}
              showInfo={false}
              style={{ width: "60px" }}
            />
            <span style={{ color: isHealthy ? "inherit" : "red" }}>
              {readyReplicas}
            </span>
            {`/${desiredReplicas}`}
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

  const handleShowDetail = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setDrawerVisible(true);
  };

  const getDeploymentStatus = (deployment: Deployment) => {
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

    return { text: "Waiting", status: "Warning" };
  };
  const [modal, contextHolder] = Modal.useModal();
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
      onOk: async () => {
        try {
          await deleteDeployment(
            deployment.metadata?.name!,
            deployment.metadata?.namespace
          );
          message.success(
            `${formatMessage({ id: "button.delete_success" })} ${deployment.metadata?.name}`
          );
          list_deployments();
        } catch (error) {
          message.error(
            `${formatMessage({ id: "button.delete_failed" })} ${error}`
          );
        }
      },
    });
  };

  const list_deployments = async (refresh = false) => {
    if (!refresh) {
      setLoading(true);
    }

    try {
      const res = await listDeployment(namespace);
      setDeployments(res);
    } catch (error) {
      message.error(`${formatMessage({ id: "button.get_failed" })} ${error}`);
    } finally {
      if (!refresh) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    list_deployments();
    // const interval = setInterval(() => {
    //   list_deployments(true);
    // }, 5000);
    // return () => clearInterval(interval);
  }, [namespace]);

  const filterDeployments = (searchText: string): Deployment[] => {
    try {
      if (searchText === "" || typeof searchText !== "string")
        return deployments;

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
  return (
    <>
      <MyTable
        loading={loading}
        columns={columns}
        refresh={list_deployments}
        del={() => {}}
        filter={filterDeployments}
        total={deployments.length}
      />
      <DeploymentDetailDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        name={selectedDeployment?.metadata?.name!}
        namespace={selectedDeployment?.metadata?.namespace!}
      />
      <div>{contextHolder}</div>
    </>
  );
};

export default DeploymentPage;
