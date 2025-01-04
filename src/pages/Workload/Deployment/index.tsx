import { FC } from "react";
import { useSearchParams } from "react-router-dom";
import { Col, Row, Table, TableProps, Input, Dropdown, Button } from "antd";
import { useEffect, useState, useMemo } from "react";
import { useAppDispatch } from "@/store/hook";
import { Deployment } from "kubernetes-models/apps/v1";
import { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from "@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta";
import getAge from "@/utils/k8s/date";
import { kubernetes_request } from "@/api/cluster";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";

const DeploymentView: FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const [deployments, setDeployments] = useState<Array<Deployment>>([]);
  const [searchText, setSearchText] = useState<string>("");

  useEffect(() => {
    const namespace = searchParams.get("namespace") || "";
    kubernetes_request<Array<Deployment>>(
      "GET",
      "/apis/apps/v1/namespaces/" + namespace + "/deployments?limit=500"
    ).then((res) => {
      setDeployments(res);
    });
  }, [dispatch, searchParams]);

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
  const columns: TableProps<Deployment>["columns"] = [
    {
      title: "Name",
      dataIndex: "metadata",
      key: "name",
      render: (metadata: any) => metadata.name,
    },
    {
      title: "Namespace",
      dataIndex: "metadata",
      key: "namespace",
      render: (metadata: IIoK8sApimachineryPkgApisMetaV1ObjectMeta) =>
        metadata.namespace,
    },
    {
      title: "Status",
      key: "status",
      render: (record: Deployment) => {
        const status = getDeploymentStatus(record);
        return <span style={{ color: status.color }}>{status.text}</span>;
      },
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
      title: "Ready",
      dataIndex: "status",
      key: "readyReplicas",
      render: (status: any) => status.readyReplicas,
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
                },
                { type: "divider" },
                { key: "terminal", label: "终端", icon: <SettingOutlined /> },
                { key: "logs", label: "日志", icon: <SettingOutlined /> },
                { key: "files", label: "文件", icon: <SettingOutlined /> },
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

  const filteredDeployments = useMemo(() => {
    return deployments.filter((deployment: Deployment) =>
      deployment.metadata?.name
        ?.toLowerCase()
        .includes(searchText.toLowerCase())
    );
  }, [deployments, searchText]);

  return (
    <Row gutter={16}>
      <Col span={24}>
        <Input
          placeholder="Search Deployments"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Table
          columns={columns}
          rowKey={(record) => record.metadata?.uid!}
          dataSource={filteredDeployments}
          pagination={{ pageSize: 10 }}
        />
      </Col>
    </Row>
  );
};

export default DeploymentView;
