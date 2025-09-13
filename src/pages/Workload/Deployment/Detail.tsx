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
  Popconfirm,
  Segmented,
} from "antd";
import { Deployment, ReplicaSet } from "kubernetes-models/apps/v1";
import getAge, { dateFormat } from "@/utils/k8s/date";
import { Pod } from "kubernetes-models/v1";
import { useState, useEffect, useRef } from "react";
import { formatAnnotations, getImages, listImages } from "@/utils/k8s/tools";
import { kubernetes_request } from "@/api/cluster";
import UIcon from "@/components/UIcon";
import { useLocale } from "@/locales";
import { deleteDeployment, getDeployment } from "@/api/deployment";
import CustomEdit, { CustomEditRef } from "@/components/CustomEdit";
import jsYaml from "js-yaml";
import "./index.scss";
import { createWindow } from "@/utils/windows/actions";

interface DeploymentDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  namespace: string;
}

const DeploymentDetailDrawer: React.FC<DeploymentDetailDrawerProps> = ({
  visible,
  onClose,
  name,
  namespace,
}) => {
  const [pods, setPods] = useState<Array<Pod>>([]);
  const [loading, setLoading] = useState(false);
  const [replicaSets, setReplicaSets] = useState<ReplicaSet[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { formatMessage } = useLocale();
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [isEditOpen, setIsEditOpen] = useState(false);
  // const [editDeployment, setEditDeployment] = useState<string>("");
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [diff, setDiff] = useState(false);
  // const [editedContent, setEditedContent] = useState<string>("");
  const customEditRef = useRef<CustomEditRef>(null);
  const [renderSideBySide, setRenderSideBySide] = useState(false);

  const fetchPods = async (deployment: Deployment | null) => {
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

  const fetchReplicaSets = async (deployment: Deployment | null) => {
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

      // sort by creationTimestamp
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
  const getDeploymentByName = async () => {
    const res = await getDeployment(name, namespace);
    setDeployment(res);
  };

  const refresh = async () => {
    await getDeploymentByName();
    // await fetchPods(deployment);
    // await fetchReplicaSets(deployment);
  };

  useEffect(() => {
    if (visible && name && namespace) {
      getDeploymentByName();
    }
  }, [visible, name, namespace]);

  useEffect(() => {
    setTimeout(async () => {
      await fetchPods(deployment);
      await fetchReplicaSets(deployment);
    }, 200);
  }, [deployment]);

  const [modal, contextHolder] = Modal.useModal();

  if (!deployment) return null;
  const { metadata, spec, status } = deployment;

  const handleRollback = (replicaSet: ReplicaSet) => {
    modal.confirm({
      title: formatMessage({ id: "button.rollback_title" }),
      content: (
        <span>
          {formatMessage({ id: "button.rollback_content" })}
          <Tag color="red" bordered={false}>
            {
              replicaSet.metadata?.annotations?.[
                "deployment.kubernetes.io/revision"
              ]
            }
          </Tag>
          ?
        </span>
      ),
      okText: formatMessage({ id: "button.confirm" }),
      cancelText: formatMessage({ id: "button.cancel" }),
      okButtonProps: { size: "small" },
      cancelButtonProps: { size: "small" },
      onOk: async () => {
        if (!metadata?.name || !metadata?.namespace) return;

        try {
          const updateBody = [
            {
              op: "replace",
              path: "/spec/template",
              value: JSON.parse(JSON.stringify(replicaSet.spec!.template)),
            },
            {
              op: "replace",
              path: "/metadata/annotations",
              value: JSON.parse(JSON.stringify(metadata.annotations)),
            },
          ];
          await kubernetes_request(
            "PATCH",
            `/apis/apps/v1/namespaces/${metadata?.namespace}/deployments/${metadata?.name}`,
            updateBody,
            {
              "Content-Type": "application/json-patch+json",
            }
          );

          messageApi.success(formatMessage({ id: "message.success" }));
          refresh();
        } catch (error) {
          messageApi.error(`${formatMessage({ id: "message.error" })}`);
        }
      },
    });
  };
  const handleRedeploy = async () => {
    if (!metadata?.name || !metadata?.namespace) return;
    const patchData = {
      spec: {
        template: {
          metadata: {
            annotations: {
              "ksm.kubernetes.io/restartAt": new Date().toISOString(),
            },
          },
        },
      },
    };
    try {
      await kubernetes_request(
        "PATCH",
        `/apis/apps/v1/namespaces/${metadata?.namespace}/deployments/${metadata?.name}`,
        patchData,
        {
          "Content-Type": "application/merge-patch+json",
        }
      ).then(() => {
        messageApi.success(formatMessage({ id: "message.success" }));
        refresh();
      });
    } catch (error) {
      messageApi.error(`${formatMessage({ id: "message.error" })}`);
    }
  };

  const patchDeployment = async (patchData: Deployment) => {
    try {
      await kubernetes_request(
        "PATCH",
        `/apis/apps/v1/namespaces/${metadata?.namespace}/deployments/${metadata?.name}`,
        patchData,
        {
          "Content-Type": "application/merge-patch+json",
        }
      );
      messageApi.success(formatMessage({ id: "message.success" }));
      refresh();
    } catch (error) {
      messageApi.error(`${formatMessage({ id: "message.error" })}`);
    }
  };
  const handleEdit = () => {
    // if (deployment) {
    //   setEditedContent(jsYaml.dump(deployment));
    // }
    setIsEditOpen(true);
  };
  const handleCancel = () => {
    // 重置编辑器数据
    customEditRef.current?.reset();
    // 重置diff状态
    setDiff(false);
    setIsEditOpen(false);
    setRenderSideBySide(false);
  };
  const handleOk = async () => {
    // 获取最终编辑的内容
    const finalContent = customEditRef.current?.getContent();
    if (finalContent) {
      const pathData = jsYaml.load(finalContent) as Deployment;
      await patchDeployment(pathData);
    }
    refresh();
    handleCancel();
  };

  const handleLog = async (pod: Pod) => {
    await createWindow({
      label: `${pod.metadata!.name}_log`,
      title: `${pod.metadata!.name}_log`,
      url: `/log/${pod.metadata!.name}/${pod.metadata!.namespace}`,
      x: 600,
      y: 800,
      width: 1000,
      height: 640,
    });
  };

  const handleTerminal = async (pod: Pod) => {
    await createWindow({
      label: `${pod.metadata!.name}_terminal`,
      title: `${pod.metadata!.name}_terminal`,
      url: `/terminal/${pod.metadata!.name}/${pod.metadata!.namespace}`,
      x: 600,
      y: 800,
      width: 1000,
      height: 640,
    });
  };

  return (
    <>
      <Modal
        title={
          <span>
            <Tag color="magenta" bordered={false}>
              {formatMessage({ id: "button.edit" })}{" "}
              <span> {metadata?.name}</span>
            </Tag>
            {diff && (
              <Segmented<string>
                size="small"
                options={["single", "side-by-side"]}
                onChange={() => setRenderSideBySide(!renderSideBySide)}
              />
            )}
          </span>
        }
        centered
        onCancel={handleCancel}
        open={isEditOpen}
        width={"70%"}
        className="p-0"
        footer={[
          <Button type="primary" size="small" onClick={() => setDiff(!diff)}>
            {formatMessage({ id: "button.diff" })}
          </Button>,

          <Button size="small" onClick={handleCancel}>
            {formatMessage({ id: "button.cancel" })}
          </Button>,
          <Button type="primary" size="small" onClick={handleOk}>
            {formatMessage({ id: "button.confirm" })}
          </Button>,
        ]}
      >
        <CustomEdit
          ref={customEditRef}
          height={"80vh"}
          original={jsYaml.dump(deployment)}
          readOnly={false}
          diff={diff}
          renderSideBySide={renderSideBySide}
        />
      </Modal>
      <Drawer
        mask={false}
        title={
          <Space>
            <Tag
              icon={<UIcon type="icon-deploymentunit" size={14} color="blue" />}
              color="magenta"
              bordered={false}
            >
              <span> {metadata?.name}</span>
            </Tag>
          </Space>
        }
        placement="right"
        width={"65%"}
        onClose={onClose}
        open={visible}
        size="default"
        extra={
          <Space>
            <Button type="primary" size="small" onClick={handleEdit}>
              {formatMessage({ id: "button.edit" })}
            </Button>
            <Popconfirm
              title={formatMessage({ id: "button.redeploy_title" })}
              description={() => (
                <span>
                  {formatMessage({ id: "button.redeploy_content" })}
                  <Tag color="red" bordered={false}>
                    {metadata?.name}
                  </Tag>
                  ?
                </span>
              )}
              onConfirm={handleRedeploy}
            >
              <Button size="small">
                {formatMessage({ id: "button.redeploy" })}
              </Button>
            </Popconfirm>

            <Button size="small" onClick={refresh}>
              {formatMessage({ id: "button.refresh" })}
            </Button>
            <Button
              danger
              size="small"
              onClick={() =>
                deleteDeployment(metadata?.name!, metadata?.namespace!)
              }
            >
              {formatMessage({ id: "button.delete" })}
            </Button>
          </Space>
        }
      >
        {contextHolder}
        {contextHolderMessage}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Divider orientation="left" style={{ marginTop: 0 }}>
              {formatMessage({ id: "deployemnt.basic" })}
            </Divider>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item
                label={formatMessage({ id: "deployment.name" })}
              >
                <Typography.Text copyable>{metadata?.name}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={formatMessage({ id: "deployment.namespace" })}
              >
                <Typography.Text copyable>
                  {metadata?.namespace}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={formatMessage({ id: "deployemnt.create_time" })}
              >
                {metadata?.creationTimestamp &&
                  getAge(metadata?.creationTimestamp)}
              </Descriptions.Item>
              <Descriptions.Item
                label={formatMessage({ id: "deployemnt.image" })}
              >
                {listImages(spec!.template!.spec)}
              </Descriptions.Item>
              <Descriptions.Item
                span={2}
                label={formatMessage({ id: "deployemnt.labels" })}
              >
                <Typography.Paragraph
                  ellipsis={{
                    rows: 3,
                    expandable: "collapsible",
                  }}
                >
                  {formatAnnotations(metadata?.labels)}
                </Typography.Paragraph>
              </Descriptions.Item>
              <Descriptions.Item
                span={2}
                label={formatMessage({ id: "deployemnt.annotations" })}
              >
                <Typography.Paragraph
                  ellipsis={{
                    rows: 3,
                    expandable: "collapsible",
                    // expanded,
                  }}
                >
                  {formatAnnotations(metadata?.annotations)}
                </Typography.Paragraph>
              </Descriptions.Item>
            </Descriptions>
          </Col>

          <Col span={24}>
            <Divider orientation="left">
              {formatMessage({ id: "deployemnt.state" })}
            </Divider>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item
                label={formatMessage({ id: "deployment.desired_replicas" })}
              >
                {spec?.replicas || "-"}
              </Descriptions.Item>
              <Descriptions.Item
                label={formatMessage({ id: "deployment.current_replicas" })}
              >
                {status?.replicas || "-"}
              </Descriptions.Item>
              <Descriptions.Item
                label={formatMessage({ id: "deployment.ready_replicas" })}
              >
                {status?.readyReplicas || 0}
              </Descriptions.Item>
              <Descriptions.Item
                label={formatMessage({ id: "deployment.updated_replicas" })}
              >
                {status?.updatedReplicas || "-"}
              </Descriptions.Item>
              <Descriptions.Item
                label={formatMessage({ id: "deployment.available_replicas" })}
              >
                {status?.availableReplicas || 0}
              </Descriptions.Item>
              <Descriptions.Item
                label={formatMessage({ id: "deployment.update_strategy" })}
              >
                {spec?.strategy?.type}
              </Descriptions.Item>
            </Descriptions>
          </Col>

          <Col span={24}>
            <Divider orientation="left">
              {formatMessage({ id: "deployemnt.strategy" })}
            </Divider>
            <Descriptions size="small" bordered column={2}>
              <Descriptions.Item
                label={formatMessage({ id: "deployemnt.strategy.max_surge" })}
              >
                {spec?.strategy?.rollingUpdate?.maxSurge || "-"}
              </Descriptions.Item>
              <Descriptions.Item
                label={formatMessage({
                  id: "deployemnt.strategy.max_unavailable",
                })}
              >
                {spec?.strategy?.rollingUpdate?.maxUnavailable || "-"}
              </Descriptions.Item>
            </Descriptions>
          </Col>

          <Col span={24}>
            <Divider orientation="left">
              {formatMessage({ id: "deployemnt.container" })}
            </Divider>

            <Table
              loading={loading}
              tableLayout="auto"
              columns={[
                {
                  title: formatMessage({ id: "deployment.name" }),
                  dataIndex: ["metadata", "name"],
                  key: "name",
                  render: (text: string) => (
                    <Typography.Text copyable>{text}</Typography.Text>
                  ),
                },
                {
                  title: formatMessage({ id: "deployment.status" }),
                  dataIndex: ["status", "phase"],
                  key: "status",
                  align: "center",
                  width: 90,
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
                  title: formatMessage({ id: "deployment.restart_count" }),
                  dataIndex: ["status", "containerStatuses"],
                  key: "restarts",
                  width: 80,
                  align: "center",
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
                  title: formatMessage({ id: "deployemnt.create_time" }),
                  width: 80,
                  dataIndex: ["metadata", "creationTimestamp"],
                  key: "age",
                  render: (timestamp: string) => getAge(timestamp),
                },
                {
                  title: formatMessage({ id: "button.action" }),
                  key: "action",
                  align: "center",
                  width: 156,
                  render: (_, record: Pod) => (
                    <div>
                      <Button
                        color="primary"
                        variant="link"
                        style={{ padding: 0 }}
                        size="small"
                        onClick={() => handleLog(record)}
                      >
                        {formatMessage({ id: "button.log" })}
                      </Button>
                      <Divider type="vertical" />
                      <Button
                        color="primary"
                        variant="link"
                        style={{ padding: 0 }}
                        size="small"
                        onClick={() => handleTerminal(record)}
                        disabled={
                          record.status?.phase !== "Running" ||
                          record.status?.containerStatuses?.length === 0
                        }
                      >
                        {formatMessage({ id: "button.terminal" })}
                      </Button>
                      <Divider type="vertical" />

                      <Button
                        color="danger"
                        variant="link"
                        style={{ padding: 0 }}
                        size="small"
                      >
                        {formatMessage({ id: "button.delete" })}
                      </Button>
                    </div>
                  ),
                },
              ]}
              dataSource={pods}
              rowKey={(record) => record.metadata?.name || ""}
              pagination={false}
            />
          </Col>

          <Col span={24}>
            <Divider orientation="left">
              {formatMessage({ id: "deployemnt.history" })}
            </Divider>
            <Table
              loading={historyLoading}
              columns={[
                {
                  title: formatMessage({ id: "deployemnt.history_version" }),
                  key: "revision",
                  align: "center",
                  render: (_, record: ReplicaSet) =>
                    record.metadata?.annotations?.[
                      "deployment.kubernetes.io/revision"
                    ] || "-",
                },
                {
                  title: formatMessage({ id: "deployemnt.image" }),
                  dataIndex: ["spec", "template", "spec"],
                  key: "images",
                  render: (spec) => getImages(spec),
                },
                {
                  title: formatMessage({ id: "deployemnt.create_time" }),
                  dataIndex: ["metadata", "creationTimestamp"],
                  key: "age",
                  align: "center",
                  width: "170px",
                  render: (timestamp: string) => (
                    <span>{dateFormat(timestamp)}</span>
                  ),
                },
                {
                  title: formatMessage({ id: "button.action" }),
                  key: "action",
                  fixed: "right",
                  align: "center",
                  render: (_, record: ReplicaSet) => (
                    <Space>
                      <Button
                        size="small"
                        onClick={() => handleRollback(record)}
                        disabled={
                          record.metadata?.annotations?.[
                            "deployment.kubernetes.io/revision"
                          ] ===
                          metadata?.annotations?.[
                            "deployment.kubernetes.io/revision"
                          ]
                        }
                      >
                        {formatMessage({ id: "deployemnt.history_rollback" })}
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
    </>
  );
};

export default DeploymentDetailDrawer;
