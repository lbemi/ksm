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
  Button,
  Row,
  Col,
  message,
  Modal,
} from "antd";
import { Deployment, ReplicaSet } from "kubernetes-models/apps/v1";
import getAge from "@/utils/k8s/date";
import { Pod } from "kubernetes-models/v1";
import { useState, useEffect } from "react";
import { getImages } from "@/utils/k8s/tools";
import { kubernetes_request } from "@/api/cluster";

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
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(false);
  const [replicaSets, setReplicaSets] = useState<ReplicaSet[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (visible && deployment?.metadata?.labels) {
      fetchPods();
      fetchReplicaSets();
    }
  }, [visible, deployment]);

  const fetchPods = async () => {
    if (
      !deployment?.metadata?.namespace ||
      !deployment?.spec?.selector.matchLabels
    )
      return;

    setLoading(true);
    try {
      // 构建标签选择器
      const labelSelector = Object.entries(deployment.spec.selector.matchLabels)
        .map(([key, value]) => `${key}=${value}`)
        .join(",");

      kubernetes_request<Array<Pod>>(
        "GET",
        `/api/v1/namespaces/${deployment.metadata.namespace}/pods?labelSelector=${labelSelector}`
      ).then((res) => {
        setPods(res);
      });
    } catch (error) {
      console.error("Failed to fetch pods:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplicaSets = async () => {
    if (
      !deployment?.metadata?.namespace ||
      !deployment?.spec?.selector.matchLabels
    )
      return;

    setHistoryLoading(true);
    try {
      const labelSelector = Object.entries(deployment.spec.selector.matchLabels)
        .map(([key, value]) => `${key}=${value}`)
        .join(",");

      const response = await kubernetes_request<ReplicaSet[]>(
        "GET",
        `/apis/apps/v1/namespaces/${deployment.metadata.namespace}/replicasets?labelSelector=${labelSelector}`
      );

      // 按创建时间排序
      const sortedReplicaSets = (response || []).sort((a, b) => {
        return (
          new Date(b.metadata?.creationTimestamp || "").getTime() -
          new Date(a.metadata?.creationTimestamp || "").getTime()
        );
      });

      setReplicaSets(sortedReplicaSets);
    } catch (error) {
      console.error("Failed to fetch replicasets:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRollback = (replicaSet: ReplicaSet) => {
    Modal.confirm({
      title: "确认回滚",
      content: `确定要回滚到版本 ${replicaSet.metadata?.annotations?.["deployment.kubernetes.io/revision"]} 吗？`,
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        if (!deployment?.metadata?.name || !deployment?.metadata?.namespace)
          return;

        try {
          await kubernetes_request(
            "PATCH",
            `/apis/apps/v1/namespaces/${deployment.metadata.namespace}/deployments/${deployment.metadata.name}`,
            [
              {
                op: "replace",
                path: "/spec/template",
                value: replicaSet!.spec!.template,
              },
              {
                op: "replace",
                path: "/metadata/annotations",
                value: deployment.metadata.annotations,
              },
            ],
            {
              "Content-Type": "application/json-patch+json",
            }
          );

          message.success("回滚操作已提交");
          fetchReplicaSets(); // 刷新历史记录
          fetchPods(); // 刷新 Pod 列表
        } catch (error) {
          message.error(`回滚失败: ${error}`);
        }
      },
    });
  };

  if (!deployment) return null;

  const { metadata, spec, status } = deployment;

  return (
    <Drawer
      title={
        <Space>
          <span>Deployment 详情</span>
          <Tag>{metadata?.name}</Tag>
        </Space>
      }
      placement="right"
      width={900}
      onClose={onClose}
      open={visible}
      style={{
        position: "fixed",
        zIndex: 1001,
        top: 64,
        width: "900px",
        height: "calc(100% - 64px)",
      }}
      extra={
        <Space>
          <Button type="primary">编辑YAML</Button>
          <Button>重新部署</Button>
          <Button>刷新</Button>
          <Button danger>删除</Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Descriptions title="基本信息" column={2} bordered>
            <Descriptions.Item label="名称">{metadata?.name}</Descriptions.Item>
            <Descriptions.Item label="命名空间">
              {metadata?.namespace}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {metadata?.creationTimestamp &&
                getAge(metadata.creationTimestamp)}
            </Descriptions.Item>
            <Descriptions.Item label="镜像">
              {spec?.template?.spec?.containers?.[0]?.image}
            </Descriptions.Item>
          </Descriptions>
        </Col>

        <Col span={24}>
          <Descriptions title="状态信息" bordered column={2}>
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
        </Col>

        <Col span={24}>
          <Divider orientation="left">滚动更新策略</Divider>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="最大超出数">
              {spec?.strategy?.rollingUpdate?.maxSurge || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="最大不可用数">
              {spec?.strategy?.rollingUpdate?.maxUnavailable || "-"}
            </Descriptions.Item>
          </Descriptions>
        </Col>

        <Col span={24}>
          <Divider orientation="left">容器信息</Divider>
          <Table
            loading={loading}
            columns={[
              {
                title: "名称",
                dataIndex: ["metadata", "name"],
                key: "name",
                render: (text: string) => (
                  <Typography.Text copyable>{text}</Typography.Text>
                ),
              },
              {
                title: "状态",
                dataIndex: ["status", "phase"],
                key: "status",
                render: (phase: string) => {
                  const color =
                    phase === "Running"
                      ? "success"
                      : phase === "Pending"
                      ? "warning"
                      : "error";
                  return <Badge status={color} text={phase} />;
                },
              },
              {
                title: "镜像",
                dataIndex: ["spec", "containers"],
                key: "images",
                render: (containers) => getImages(containers),
              },
              {
                title: "重启次数",
                dataIndex: ["status", "containerStatuses"],
                key: "restarts",
                render: (statuses: any[]) => {
                  const total =
                    statuses?.reduce(
                      (sum, status) => sum + status.restartCount,
                      0
                    ) || 0;
                  return <span>{total}</span>;
                },
              },
              {
                title: "创建时间",
                dataIndex: ["metadata", "creationTimestamp"],
                key: "age",
                render: (timestamp: string) => getAge(timestamp),
              },
            ]}
            dataSource={pods}
            rowKey={(record) => record.metadata?.name || ""}
            pagination={false}
          />
        </Col>

        <Col span={24}>
          <Divider orientation="left">历史版本</Divider>
          <Table
            loading={historyLoading}
            columns={[
              {
                title: "版本",
                key: "revision",
                render: (_, record: ReplicaSet) =>
                  record.metadata?.annotations?.[
                    "deployment.kubernetes.io/revision"
                  ] || "-",
              },
              {
                title: "镜像",
                dataIndex: ["spec", "template", "spec", "containers"],
                key: "images",
                render: (containers) => getImages(containers),
              },
              {
                title: "创建时间",
                dataIndex: ["metadata", "creationTimestamp"],
                key: "age",
                render: (timestamp: string) => getAge(timestamp),
              },
              {
                title: "操作",
                key: "action",
                render: (_, record: ReplicaSet) => (
                  <Space>
                    <Button
                      size="small"
                      onClick={() => handleRollback(record)}
                      disabled={
                        record.metadata?.annotations?.[
                          "deployment.kubernetes.io/revision"
                        ] ===
                        deployment?.metadata?.annotations?.[
                          "deployment.kubernetes.io/revision"
                        ]
                      }
                    >
                      回滚到此版本
                    </Button>
                  </Space>
                ),
              },
            ]}
            dataSource={replicaSets}
            rowKey={(record) => record.metadata?.name || ""}
            pagination={false}
          />
        </Col>
      </Row>
    </Drawer>
  );
};

export default DeploymentDetailDrawer;
