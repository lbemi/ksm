import { FC } from "react";
import MyIcon from "@/components/MyIcon";

import { useSearchParams } from "react-router-dom";
import { Card, Col, Row, Table, TableProps } from "antd";
import { useEffect, useState } from "react";
import { useAppDispatch } from "@/store/hook";
import { Deployment } from "kubernetes-models/apps/v1";
import { invoke } from "@tauri-apps/api/core";
import { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from "@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta";
import getAge from "@/utils/k8s/date";

const DeploymentView: FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const [deployments, setDeployments] = useState<Array<Deployment>>([]);
  useEffect(() => {
    const namespace = searchParams.get("namespace") || "";
    invoke("kubernetes_api", {
      resource: "deployments",
      verb: "GET",
      namespace: "default",
    }).then((res) => {
      setDeployments(res as Array<Deployment>);
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
  ];

  return (
    <Row gutter={16}>
      <Col span={24}>
        <Table columns={columns} dataSource={deployments} />
      </Col>
    </Row>
  );
};

export default DeploymentView;
