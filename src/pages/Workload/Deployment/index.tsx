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

import "./index.scss";
import { Typography } from "antd";
import { kubernetes_request } from "@/api/cluster";
import { Deployment } from "kubernetes-models/apps/v1";
import { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from "@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta";
import getAge from "@/utils/k8s/date";
import MyTable from "@/components/MyTable";
import { getImages } from "@/utils/k8s/tools.tsx";

const DeploymentPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [deployments, setDeployments] = useState<Array<Deployment>>([]);
  const clusterName = useAppSelector((state) => state.kubernetes.activeCluster);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const { Paragraph } = Typography;

  const columns: TableProps<Deployment>["columns"] = [
    {
      title: "名称",
      dataIndex: ["metadata", "name"],
      key: "name",
      fixed: "left",
      render: (text) => (
        <div className="deployment-name-cell">
          <Paragraph
            copyable={{
              text: text,
              tooltips: ["复制名称", "已复制"],
            }}
            style={{ marginRight: 8, marginBottom: 0 }}
          />
          <span className="deployment-name-text" title={text}>
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
      title: "副本数(正常/异常)",
      dataIndex: ["spec", "replicas"],
      width: 200,
      key: "replicas",
      render: (text) => <div>{text}</div>,
    },
    {
      title: "镜像",
      dataIndex: ["spec", "template", "spec", "containers"],
      key: "image",
      align: "center",
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
                { key: "detail", label: "详情", icon: <EyeOutlined /> },
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

  const getDeploymentStatus = (deployment: Deployment) => {
    const status = deployment.status;
    if (!status) return { text: "Unknown", color: "gray" };

    const { replicas = 0, readyReplicas = 0, updatedReplicas = 0 } = status;

    if (replicas === 0) {
      return { text: "Stopped", color: "red" };
    }

    if (readyReplicas === replicas && updatedReplicas === replicas) {
      return { text: "Running", color: "green" };
    }

    if (readyReplicas < replicas) {
      return { text: "Pending", color: "orange" };
    }

    return { text: "Updating", color: "blue" };
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

  const deleteDeployments = () => {
    setTimeout(() => {
      console.log("deleteDeployments--");
      // setSelectedRowKeys([]);
    }, 1000);
  };

  const list_deployments = () => {
    setLoading(true);
    let url =
      namespace === "all"
        ? "/apis/apps/v1/deployments"
        : `/apis/apps/v1/namespaces/${namespace}/deployments`;
    kubernetes_request<Array<Deployment>>("GET", url)
      .then((res) => {
        setDeployments(res);
      })
      .catch((err) => {
        console.log("err: ", err);
      });
    setLoading(false);
  };

  useEffect(() => {
    if (!clusterName) return;
    list_deployments();
  }, [namespace]);

  const getFilteredDeployments = (searchText: string) => {
    if (searchText === "" || typeof searchText !== "string") return deployments;

    return deployments.filter((deployment: Deployment) => {
      const name = deployment.metadata!.name!.toLowerCase() || "";
      const searchLower = searchText ? searchText.toLowerCase() : "";

      return name.includes(searchLower);
    });
  };

  return (
    <>
      <MyTable
        loading={loading}
        columns={columns}
        refresh={list_deployments}
        del={deleteDeployments}
        filter={getFilteredDeployments}
      />
    </>
  );
};

export default DeploymentPage;
