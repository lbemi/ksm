import { useAppSelector } from "@/store/hook";
import { Button, TableProps, Dropdown, Modal, message } from "antd";
import { FC, useEffect, useState } from "react";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";

import { Typography } from "antd";
import { apiClient, CoreV1Url, kubernetes_request } from "@/api/cluster";
import { Deployment } from "kubernetes-models/apps/v1";
import { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from "@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta";
import getAge from "@/utils/k8s/date";
import { getImages } from "@/utils/k8s/tools.tsx";
import DeploymentDetailDrawer from "./DeploymentDetailDrawer";
import CustomContent from "@/components/CustomContent";

const DeploymentPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [deployments, setDeployments] = useState<Array<Deployment>>([]);
  const [selectedDeployment, setSelectedDeployment] =
    useState<Deployment | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const { Paragraph } = Typography;

  const columns: TableProps<Deployment>["columns"] = [
    {
      title: "名称",
      dataIndex: ["metadata", "name"],
      key: "name",
      fixed: "left",
      render: (text, record) => (
        <div className="table-name-cell">
          <Paragraph
            copyable={{
              text: text,
              tooltips: ["复制名称", "已复制"],
            }}
            style={{ marginRight: 8, marginBottom: 0 }}
          />
          <span
            className="table-name-text"
            title={text}
            onClick={() => handleShowDetail(record)}
          >
            {text}
          </span>
        </div>
      ),
    },
    ...(namespace === "all"
      ? [
          {
            title: "命名空间",
            dataIndex: ["metadata", "namespace"],
            key: "namespace",
            render: (text: string) => <div>{text}</div>,
          },
        ]
      : []),
    {
      title: "状态",
      key: "status",
      render: (record: Deployment) => {
        const status = getDeploymentStatus(record);
        return <span style={{ color: status.color }}>{status.text}</span>;
      },
    },
    {
      title: "副本数(期望/正常)",
      dataIndex: ["spec", "replicas"],
      width: 200,
      key: "replicas",
      align: "center",
      render: (_, record: Deployment) => {
        const desiredReplicas = record.spec?.replicas || 0;
        const readyReplicas = record.status?.readyReplicas || 0;
        const isHealthy = desiredReplicas === readyReplicas;

        return (
          <span>
            {`${desiredReplicas}/`}
            <span style={{ color: isHealthy ? "inherit" : "red" }}>
              {readyReplicas}
            </span>
          </span>
        );
      },
    },
    {
      title: "镜像",
      dataIndex: ["spec", "template", "spec", "containers"],
      key: "image",
      onCell: () => {
        return {
          style: {
            maxWidth: 180,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            cursor: "pointer",
          },
        };
      },
      render: (containers) => <div>{getImages(containers)}</div>,
    },
    {
      title: "Age",
      dataIndex: "metadata",
      key: "creationTimestamp",
      render: (metadata: IIoK8sApimachineryPkgApisMetaV1ObjectMeta) => {
        if (metadata.creationTimestamp) {
          return getAge(metadata.creationTimestamp);
        }
      },
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      dataIndex: "action",
      width: 100,
      render: (_, record: Deployment) => (
        <div className="action-buttons">
          <Dropdown
            menu={{
              items: [
                {
                  key: "detail",
                  label: "详情",
                  icon: <EyeOutlined />,
                  onClick: () => handleShowDetail(record),
                },
                { key: "edit", label: "编辑", icon: <EditOutlined /> },
                {
                  key: "delete",
                  label: "删除",
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDeleteDeployment(record),
                },
                { type: "divider" },
                { key: "scale", label: "缩放", icon: <SettingOutlined /> },
              ],
            }}
          >
            <Button type="link" size="small">
              更多 <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      ),
    },
  ];

  const handleShowDetail = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setDrawerVisible(true);
  };

  const getDeploymentStatus = (deployment: Deployment) => {
    const status = deployment.status;
    if (!status) return { text: "Unknown", color: "#909399" };

    const { replicas = 0, availableReplicas = 0 } = status;
    const desiredReplicas = deployment.spec?.replicas || 0;

    // Updating status
    if (
      replicas > availableReplicas ||
      (replicas > desiredReplicas && availableReplicas)
    ) {
      return { text: "Updating", color: "#e6a23c" };
    }

    // Running status
    if (
      desiredReplicas === 0 ||
      (availableReplicas && availableReplicas === desiredReplicas)
    ) {
      return { text: "Running", color: "#388c04" };
    }

    // Waiting/Error status
    return { text: "Waiting", color: "#f56c6c" };
  };

  const handleDeleteDeployment = (deployment: Deployment) => {
    Modal.confirm({
      title: "确认删除",
      content: (
        <span>
          您确定要删除 Deployment{" "}
          <span style={{ color: "red" }}>{deployment.metadata?.name}</span> 吗？
        </span>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await kubernetes_request(
            "DELETE",
            `/apis/apps/v1/namespaces/${deployment.metadata?.namespace}/deployments/${deployment.metadata?.name}`
          );
          message.success(`Deployment ${deployment.metadata?.name} 删除成功`);
          list_deployments();
        } catch (error) {
          message.error(`删除失败: ${error}`);
        }
      },
    });
  };

  const list_deployments = async (refresh = false) => {
    if (!refresh) {
      setLoading(true);
    }
    try {
      // let url =
      //   namespace === "all"
      //     ? "/apis/apps/v1/deployments"
      //     : `/apis/apps/v1/namespaces/${namespace}/deployments`;
      const res = await apiClient.get<Deployment>(
        CoreV1Url,
        "deployments",
        namespace
      );
      setDeployments(res);
    } catch (error) {
      message.error("获取Deployment列表失败");
    } finally {
      if (!refresh) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    list_deployments();
    const interval = setInterval(() => {
      list_deployments(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [namespace]);

  const filterDeployments = (searchText: string) => {
    if (searchText === "" || typeof searchText !== "string") return deployments;

    return deployments.filter((deployment) => {
      const name = deployment.metadata?.name?.toLowerCase() || "";
      const namespace = deployment.metadata?.namespace?.toLowerCase() || "";
      const searchLower = searchText.toLowerCase();

      return name.includes(searchLower) || namespace.includes(searchLower);
    });
  };
  return (
    <>
      {/* <MyTable
        loading={loading}
        columns={columns}
        refresh={list_deployments}
        del={() => {}}
        filter={filterDeployments}
      /> */}
      <CustomContent
        columns={columns}
        refresh={list_deployments}
        filter={filterDeployments}
        loading={loading}
        total={deployments.length}
      />
      <DeploymentDetailDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        deployment={selectedDeployment}
      />
    </>
  );
};

export default DeploymentPage;
