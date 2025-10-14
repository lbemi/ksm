import React, { useState, useEffect, useRef } from "react";
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
  InputNumber,
} from "antd";
import jsYaml from "js-yaml";

// Kubernetes types
import { Deployment, ReplicaSet } from "kubernetes-models/apps/v1";
import { IPodTemplateSpec, Pod } from "kubernetes-models/v1";

// API functions
import { kubernetes_request } from "@/api/cluster";
import {
  deleteDeployment,
  getDeployment,
  scaleDeployment,
} from "@/api/deployment";

// Components
import MyIcon from "@/components/MyIcon";
import CustomEdit, { CustomEditRef } from "@/components/CustomEdit";

// Utils and hooks
import getAge, { dateFormat } from "@/utils/k8s/date";
import { formatAnnotations, getImages, listImages } from "@/utils/k8s/tools";
import { useLocale } from "@/locales";

// Styles
import "./index.scss";
import { createLogWindow, createTerminalWindow } from "@/api/pod";
import PodDetailDrawer from "@/components/PodDetail";
import EllipsisMiddle from "@/components/EllipsisMiddle";

const { Text: _Text } = Typography;
// Utility functions
const buildLabelSelector = (matchLabels: Record<string, string>): string => {
  return Object.entries(matchLabels)
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
};

const sortReplicaSetsByTimestamp = (
  replicaSets: ReplicaSet[]
): ReplicaSet[] => {
  return (replicaSets || []).sort((a, b) => {
    return (
      new Date(b.metadata?.creationTimestamp || "").getTime() -
      new Date(a.metadata?.creationTimestamp || "").getTime()
    );
  });
};

const createPatchBody = (template: any, annotations: any) => [
  {
    op: "replace",
    path: "/spec/template",
    value: JSON.parse(JSON.stringify(template)),
  },
  {
    op: "replace",
    path: "/metadata/annotations",
    value: JSON.parse(JSON.stringify(annotations)),
  },
];

// Column configurations
const getPodTableColumns = (
  formatMessage: any,
  handleLog: (pod: Pod) => void,
  handleShowDetail: (pod: Pod) => void,
  handleTerminal: (pod: Pod) => void
) => [
  {
    title: formatMessage({ id: "deployment.name" }),
    dataIndex: ["metadata", "name"],
    key: "name",
    render: (text: string, record: Pod) => (
      <EllipsisMiddle
        suffixCount={10}
        endCount={15}
        type="success"
        copyable
        onClick={() => handleShowDetail(record)}
      >
        {text}
      </EllipsisMiddle>
    ),
  },
  {
    title: formatMessage({ id: "deployment.status" }),
    dataIndex: ["status", "phase"],
    key: "status",
    align: "center" as const,
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
    align: "center" as const,
    render: (statuses: any[]) => {
      const total =
        statuses?.reduce((sum, status) => sum + status.restartCount, 0) || 0;
      return <span>{total}</span>;
    },
  },
  {
    title: formatMessage({ id: "table.pod_ip" }),
    dataIndex: ["status", "podIP"],
    key: "ip",
    width: 80,
    align: "center" as const,
    render: (ip: string) => {
      return <span>{ip}</span>;
    },
  },
  {
    title: formatMessage({ id: "deployemnt.create_time" }),
    width: 100,
    dataIndex: ["metadata", "creationTimestamp"],
    key: "age",
    render: (timestamp: string) => getAge(timestamp),
  },
  {
    title: formatMessage({ id: "button.action" }),
    key: "action",
    align: "center" as const,
    width: 156,
    fixed: "right" as const,
    render: (_: any, record: Pod) => (
      <div>
        <Button
          color="primary"
          variant="link"
          style={{ padding: 0 }}
          size="small"
          onClick={() => handleLog(record)}
          disabled={record.status?.phase !== "Running"}
        >
          {formatMessage({ id: "button.log" })}
        </Button>
        <Divider type="vertical" style={{ margin: "0 2px" }} />
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
        <Divider type="vertical" style={{ margin: "0 2px" }} />
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
];

const getHistoryTableColumns = (
  formatMessage: any,
  handleRollback: (record: ReplicaSet) => void,
  handleDiff: (record: ReplicaSet) => void,
  currentRevision?: string
) => [
  {
    title: formatMessage({ id: "deployemnt.history_version" }),
    key: "revision",
    align: "center" as const,
    width: 100,
    render: (_: any, record: ReplicaSet) =>
      record.metadata?.annotations?.["deployment.kubernetes.io/revision"] ||
      "-",
  },
  {
    title: formatMessage({ id: "deployemnt.image" }),
    dataIndex: ["spec", "template", "spec"],
    key: "images",
    render: (spec: any) => getImages(spec),
  },
  {
    title: formatMessage({ id: "deployemnt.create_time" }),
    dataIndex: ["metadata", "creationTimestamp"],
    key: "age",
    align: "center" as const,
    width: "170px",
    render: (timestamp: string) => <span>{dateFormat(timestamp)}</span>,
  },
  {
    title: formatMessage({ id: "button.action" }),
    key: "action",
    fixed: "right" as const,
    align: "center" as const,
    render: (_: any, record: ReplicaSet) => {
      const isCurrentVersion =
        record.metadata?.annotations?.["deployment.kubernetes.io/revision"] ===
        currentRevision;
      return (
        <Space>
          <Button
            size="small"
            onClick={() => handleRollback(record)}
            disabled={isCurrentVersion}
          >
            {formatMessage({ id: "deployemnt.history_rollback" })}
          </Button>
          <Button
            size="small"
            onClick={() => handleDiff(record)}
            disabled={isCurrentVersion}
          >
            {formatMessage({ id: "button.diff" })}
          </Button>
        </Space>
      );
    },
  },
];

// Sub-components
interface DrawerActionsProps {
  formatMessage: FormatMessageFunction;
  handleEdit: () => void;
  handleScale: () => void;
  handleRedeploy: () => void;
  refresh: () => void;
  onDelete: () => void;
  deploymentName?: string;
  deploymentNamespace?: string;
}

const DrawerActions: React.FC<DrawerActionsProps> = ({
  formatMessage,
  handleEdit,
  handleScale,
  handleRedeploy,
  refresh,
  onDelete,
  deploymentName,
}) => (
  <Space>
    <Button type="primary" size="small" onClick={handleEdit}>
      {formatMessage({ id: "button.edit" })}
    </Button>
    <Button color="red" size="small" onClick={handleScale}>
      {formatMessage({ id: "button.scale" })}
    </Button>
    <Popconfirm
      title={formatMessage({ id: "button.redeploy_title" })}
      description={() => (
        <span>
          {formatMessage({ id: "button.redeploy_content" })}
          <Tag color="red" bordered={false}>
            {deploymentName}
          </Tag>
          ?
        </span>
      )}
      onConfirm={handleRedeploy}
    >
      <Button size="small">{formatMessage({ id: "button.redeploy" })}</Button>
    </Popconfirm>
    <Button size="small" onClick={refresh}>
      {formatMessage({ id: "button.refresh" })}
    </Button>
    <Button danger size="small" onClick={onDelete}>
      {formatMessage({ id: "button.delete" })}
    </Button>
  </Space>
);

interface BasicInfoProps {
  formatMessage: FormatMessageFunction;
  metadata: any;
  spec: any;
}

const BasicInfo: React.FC<BasicInfoProps> = ({
  formatMessage,
  metadata,
  spec,
}) => (
  <Descriptions column={2} bordered size="small">
    <Descriptions.Item label={formatMessage({ id: "deployment.name" })}>
      <Typography.Text copyable>{metadata?.name}</Typography.Text>
    </Descriptions.Item>
    <Descriptions.Item label={formatMessage({ id: "deployment.namespace" })}>
      <Typography.Text copyable>{metadata?.namespace}</Typography.Text>
    </Descriptions.Item>
    <Descriptions.Item label={formatMessage({ id: "deployemnt.create_time" })}>
      {metadata?.creationTimestamp && getAge(metadata?.creationTimestamp)}
      {" - "}
      {dateFormat(metadata?.creationTimestamp)}
    </Descriptions.Item>
    <Descriptions.Item label={formatMessage({ id: "deployemnt.image" })}>
      {listImages(spec!.template!.spec)}
    </Descriptions.Item>
    <Descriptions.Item
      span={2}
      label={formatMessage({ id: "deployemnt.labels" })}
    >
      <Typography.Paragraph ellipsis={{ rows: 3, expandable: "collapsible" }}>
        {formatAnnotations(metadata?.labels)}
      </Typography.Paragraph>
    </Descriptions.Item>
    <Descriptions.Item
      span={2}
      label={formatMessage({ id: "deployemnt.annotations" })}
    >
      <Typography.Paragraph ellipsis={{ rows: 3, expandable: "collapsible" }}>
        {formatAnnotations(metadata?.annotations)}
      </Typography.Paragraph>
    </Descriptions.Item>
  </Descriptions>
);

interface StatusInfoProps {
  formatMessage: FormatMessageFunction;
  spec: any;
  status: any;
}

const StatusInfo: React.FC<StatusInfoProps> = ({
  formatMessage,
  spec,
  status,
}) => (
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
);

interface StrategyInfoProps {
  formatMessage: FormatMessageFunction;
  spec: any;
}

const StrategyInfo: React.FC<StrategyInfoProps> = ({ formatMessage, spec }) => (
  <Descriptions size="small" bordered column={2}>
    <Descriptions.Item
      label={formatMessage({ id: "deployemnt.strategy.max_surge" })}
    >
      {spec?.strategy?.rollingUpdate?.maxSurge || "-"}
    </Descriptions.Item>
    <Descriptions.Item
      label={formatMessage({ id: "deployemnt.strategy.max_unavailable" })}
    >
      {spec?.strategy?.rollingUpdate?.maxUnavailable || "-"}
    </Descriptions.Item>
  </Descriptions>
);

interface DeploymentDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  namespace: string;
}

// Types for state management
interface LoadingState {
  pods: boolean;
  history: boolean;
}

interface ModalState {
  edit: boolean;
  diff: boolean;
  renderSideBySide: boolean;
  showDiff: boolean;
}

interface TempState {
  deployment: IPodTemplateSpec | null;
  modified: IPodTemplateSpec | null;
  replicaSet: ReplicaSet | null;
}

// Enhanced type definitions
type FormatMessageFunction = (descriptor: any) => string;

const DeploymentDetailDrawer: React.FC<DeploymentDetailDrawerProps> = ({
  visible,
  onClose,
  name,
  namespace,
}) => {
  // Core data state
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [pods, setPods] = useState<Array<Pod>>([]);
  const [replicaSets, setReplicaSets] = useState<ReplicaSet[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);

  // Loading state
  const [loading, setLoading] = useState<LoadingState>({
    pods: false,
    history: false,
  });

  // Modal state
  const [modalState, setModalState] = useState<ModalState>({
    edit: false,
    diff: false,
    renderSideBySide: false,
    showDiff: false,
  });

  // Temporary state for operations
  const [tempState, setTempState] = useState<TempState>({
    deployment: null,
    modified: null,
    replicaSet: null,
  });

  // Refs and hooks
  const { formatMessage } = useLocale();
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [modal, contextHolder] = Modal.useModal();
  const customEditRef = useRef<CustomEditRef>(null);
  const scaleReplicas = useRef<number>(0);
  const fetchPods = async (deployment: Deployment | null) => {
    if (
      !deployment?.metadata?.namespace ||
      !deployment?.spec?.selector.matchLabels
    )
      return;

    setLoading((prev) => ({ ...prev, pods: true }));
    try {
      const labelSelector = buildLabelSelector(
        deployment.spec.selector.matchLabels
      );
      kubernetes_request<Array<Pod>>(
        "GET",
        `/api/v1/namespaces/${deployment.metadata.namespace}/pods?labelSelector=${labelSelector}`
      ).then((res) => {
        setPods(res);
      });
    } catch (error) {
      console.error("Failed to fetch pods:", error);
    } finally {
      setLoading((prev) => ({ ...prev, pods: false }));
    }
  };

  const fetchReplicaSets = async (deployment: Deployment | null) => {
    if (
      !deployment?.metadata?.namespace ||
      !deployment?.spec?.selector.matchLabels
    )
      return;

    setLoading((prev) => ({ ...prev, history: true }));
    try {
      const labelSelector = buildLabelSelector(
        deployment.spec.selector.matchLabels
      );
      const response = await kubernetes_request<ReplicaSet[]>(
        "GET",
        `/apis/apps/v1/namespaces/${deployment.metadata.namespace}/replicasets?labelSelector=${labelSelector}`
      );

      const sortedReplicaSets = sortReplicaSetsByTimestamp(response);
      setReplicaSets(sortedReplicaSets);
    } catch (error) {
      console.error("Failed to fetch replicasets:", error);
    } finally {
      setLoading((prev) => ({ ...prev, history: false }));
    }
  };
  const getDeploymentByName = async () => {
    const res = await getDeployment(name, namespace);
    setDeployment(res);
  };

  const refresh = async () => {
    await getDeploymentByName();
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
          const updateBody = createPatchBody(
            replicaSet.spec!.template,
            metadata.annotations
          );
          await kubernetes_request(
            "PATCH",
            `/apis/apps/v1/namespaces/${metadata?.namespace}/deployments/${metadata?.name}`,
            updateBody,
            {
              "Content-Type": "application/json-patch+json",
            }
          );

          messageApi.success(formatMessage({ id: "message.success" }));
          setModalState((prev) => ({ ...prev, diff: false }));
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

  const handleScale = () => {
    scaleReplicas.current = spec?.replicas || 0;
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
        console.log(scaleReplicas.current);
        try {
          await scaleDeployment(
            metadata?.name!,
            scaleReplicas.current,
            metadata?.namespace
          );
          messageApi.success(formatMessage({ id: "message.success" }));
          refresh();
          handleCancel();
        } catch (error) {
          messageApi.error(`${formatMessage({ id: "message.error" })}`);
          handleCancel();
        }
      },
      onCancel: () => {
        handleCancel();
      },
    });
  };
  const handleEdit = () => {
    setModalState((prev) => ({ ...prev, edit: true }));
  };

  const handleCancel = () => {
    // 重置编辑器数据
    customEditRef.current?.reset();
    // 重置所有状态
    setModalState({
      edit: false,
      diff: false,
      renderSideBySide: false,
      showDiff: false,
    });
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
    await createLogWindow(pod.metadata!.name!, pod.metadata!.namespace!);
  };

  const handleTerminal = async (pod: Pod) => {
    await createTerminalWindow(pod.metadata!.name!, pod.metadata!.namespace!);
  };

  const handleDiff = (replicaSet: ReplicaSet) => {
    setTempState({
      deployment: deployment.spec!.template!,
      modified: replicaSet.spec!.template!,
      replicaSet,
    });
    setModalState((prev) => ({ ...prev, diff: true }));
  };
  const handleShowDetail = (pod: Pod) => {
    setSelectedPod(pod);
    setDrawerVisible(true);
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
            {modalState.showDiff && (
              <Segmented<string>
                size="small"
                options={["single", "side-by-side"]}
                onChange={() =>
                  setModalState((prev) => ({
                    ...prev,
                    renderSideBySide: !prev.renderSideBySide,
                  }))
                }
              />
            )}
          </span>
        }
        centered
        onCancel={handleCancel}
        open={modalState.edit}
        width={"70%"}
        className="p-0"
        footer={[
          <Button
            type="primary"
            size="small"
            onClick={() =>
              setModalState((prev) => ({ ...prev, showDiff: !prev.showDiff }))
            }
          >
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
          diff={modalState.showDiff}
          renderSideBySide={modalState.renderSideBySide}
        />
      </Modal>
      <Modal
        title={
          <span>
            <Tag color="magenta" bordered={false}>
              {formatMessage({ id: "button.diff" })}
              <span> {metadata?.name}</span>
            </Tag>
          </span>
        }
        centered
        onCancel={() => setModalState((prev) => ({ ...prev, diff: false }))}
        open={modalState.diff}
        width={"70%"}
        className="p-0"
        footer={[
          <Button
            key="cancel"
            size="small"
            onClick={() => setModalState((prev) => ({ ...prev, diff: false }))}
          >
            {formatMessage({ id: "button.cancel" })}
          </Button>,
          <Button
            key="rollback"
            size="small"
            onClick={() => handleRollback(tempState.replicaSet!)}
          >
            {formatMessage({ id: "deployemnt.history_rollback" })}
          </Button>,
        ]}
      >
        <CustomEdit
          ref={customEditRef}
          height={"80vh"}
          original={jsYaml.dump(tempState.deployment)}
          modified={jsYaml.dump(tempState.modified)}
          diff
          renderSideBySide
        />
      </Modal>
      <Drawer
        mask={false}
        title={
          <Space>
            <MyIcon type="icon-deployment_unit" size={18} />
            <Tag color="magenta" bordered={false}>
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
          <DrawerActions
            formatMessage={formatMessage}
            handleEdit={handleEdit}
            handleScale={handleScale}
            handleRedeploy={handleRedeploy}
            refresh={refresh}
            onDelete={() =>
              deleteDeployment(metadata?.name!, metadata?.namespace!)
            }
            deploymentName={metadata?.name}
            deploymentNamespace={metadata?.namespace}
          />
        }
      >
        {contextHolder}
        {contextHolderMessage}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Divider orientation="left" style={{ marginTop: 0 }}>
              {formatMessage({ id: "deployemnt.basic" })}
            </Divider>
            <BasicInfo
              formatMessage={formatMessage}
              metadata={metadata}
              spec={spec}
            />
          </Col>

          <Col span={24}>
            <Divider orientation="left">
              {formatMessage({ id: "deployemnt.state" })}
            </Divider>
            <StatusInfo
              formatMessage={formatMessage}
              spec={spec}
              status={status}
            />
          </Col>

          <Col span={24}>
            <Divider orientation="left">
              {formatMessage({ id: "deployemnt.strategy" })}
            </Divider>
            <StrategyInfo formatMessage={formatMessage} spec={spec} />
          </Col>

          <Col span={24}>
            <Divider orientation="left">
              {formatMessage({ id: "deployemnt.container" })}
            </Divider>

            <Table
              loading={loading.pods}
              tableLayout="auto"
              scroll={{ y: 200 }}
              columns={getPodTableColumns(
                formatMessage,
                handleLog,
                handleShowDetail,
                handleTerminal
              )}
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
              loading={loading.history}
              tableLayout="auto"
              scroll={{ y: 200 }}
              columns={getHistoryTableColumns(
                formatMessage,
                handleRollback,
                handleDiff,
                metadata?.annotations?.["deployment.kubernetes.io/revision"]
              )}
              dataSource={replicaSets}
              rowKey={(record) => record.metadata?.name || ""}
              pagination={false}
            />
          </Col>
        </Row>
        <PodDetailDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          name={selectedPod?.metadata?.name || ""}
          namespace={selectedPod?.metadata?.namespace || ""}
        />
      </Drawer>
    </>
  );
};

export default DeploymentDetailDrawer;
