import React, { useState, useEffect, useRef } from "react";
import {
  Drawer,
  Typography,
  Descriptions,
  Tag,
  Table,
  Space,
  Divider,
  Button,
  Row,
  Col,
  message,
  Modal,
} from "antd";

// Kubernetes types
import { IContainer, IVolumeMount, Pod } from "kubernetes-models/v1";

// API functions

// Components
import MyIcon from "@/components/MyIcon";
import { CustomEditRef } from "@/components/CustomEdit";

// Utils and hooks
import getAge, { dateFormat } from "@/utils/k8s/date";
import { formatAnnotations, listImages } from "@/utils/k8s/tools";
import { useLocale } from "@/locales";
import { deletePod, getPod } from "@/api/pod";
import Container from "@/components/Container";
import { getEventsByResource } from "@/api/event";
import { Event } from "kubernetes-models/v1";
import ViewYaml from "@/components/ViewYaml";

const sortEventsByTimestamp = (events: Event[]): Event[] => {
  return (events || []).sort((a, b) => {
    return (
      new Date(b.metadata?.creationTimestamp || "").getTime() -
      new Date(a.metadata?.creationTimestamp || "").getTime()
    );
  });
};

// Column configurations
const getPodTableColumns = (formatMessage: any) => [
  {
    title: formatMessage({ id: "table.event_type" }),
    dataIndex: ["type"],
    key: "event_type",
    width: 75,
    render: (text: string) => (
      <Typography.Text type={text === "Normal" ? "success" : "warning"}>
        {text}
      </Typography.Text>
    ),
  },
  {
    title: formatMessage({ id: "table.event_reason" }),
    dataIndex: ["reason"],
    width: 90,
    key: "event_reason",
    render: (text: string) => <Typography.Text>{text}</Typography.Text>,
  },
  {
    title: formatMessage({ id: "table.event_count" }),
    dataIndex: ["count"],
    key: "event_count",
    width: 60,
    render: (text: string) => <Typography.Text>{text}</Typography.Text>,
  },
  {
    title: formatMessage({ id: "table.event_message" }),
    dataIndex: ["message"],
    key: "event_message",
    render: (text: string) => (
      <Typography.Text type="secondary">{text}</Typography.Text>
    ),
  },

  {
    title: formatMessage({ id: "table.event_time" }),
    dataIndex: ["metadata", "creationTimestamp"],
    key: "event_time",
    fixed: "right" as const,
    width: 180,
    sorter: (a: Event, b: Event) =>
      (a.metadata?.creationTimestamp! > b.metadata?.creationTimestamp!) as any,
    render: (text: string) => (
      <Typography.Text>{dateFormat(text)}</Typography.Text>
    ),
  },
];

// Sub-components
interface DrawerActionsProps {
  formatMessage: FormatMessageFunction;
  handleEdit: () => void;
  refresh: () => void;
  onDelete: () => void;
}

const DrawerActions: React.FC<DrawerActionsProps> = ({
  formatMessage,
  handleEdit,
  refresh,
  onDelete,
}) => (
  <Space>
    <Button type="primary" size="small" onClick={handleEdit}>
      yaml
    </Button>
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
  status: any;
}

const BasicInfo: React.FC<BasicInfoProps> = ({
  formatMessage,
  metadata,
  status,
  spec,
}) => (
  <Descriptions column={2} bordered size="small">
    <Descriptions.Item label={formatMessage({ id: "table.name" })}>
      <Typography.Text copyable>{metadata?.name}</Typography.Text>
    </Descriptions.Item>
    <Descriptions.Item label={formatMessage({ id: "table.namespace" })}>
      <Typography.Text copyable>{metadata?.namespace}</Typography.Text>
    </Descriptions.Item>
    <Descriptions.Item label={formatMessage({ id: "table.create_time" })}>
      {metadata?.creationTimestamp && getAge(metadata?.creationTimestamp)}
      {" - "}
      {dateFormat(metadata?.creationTimestamp)}
    </Descriptions.Item>
    <Descriptions.Item label={formatMessage({ id: "table.ip" })}>
      {status?.podIP}
    </Descriptions.Item>
    <Descriptions.Item label={formatMessage({ id: "table.host_ip" })}>
      <div>{status?.hostIP}</div>
      <div>{spec?.nodeName}</div>
    </Descriptions.Item>
    <Descriptions.Item label={formatMessage({ id: "table.image" })}>
      {listImages(spec)}
    </Descriptions.Item>
    <Descriptions.Item label={formatMessage({ id: "table.restart_count" })}>
      {status?.containerStatuses?.reduce(
        (sum: number, status: any) => sum + status.restartCount,
        0
      ) || 0}
    </Descriptions.Item>
    <Descriptions.Item label={formatMessage({ id: "table.qosClass" })}>
      {status?.qosClass}
    </Descriptions.Item>
    <Descriptions.Item span={2} label={formatMessage({ id: "table.labels" })}>
      <Typography.Paragraph ellipsis={{ rows: 2, expandable: "collapsible" }}>
        {formatAnnotations(metadata?.labels)}
      </Typography.Paragraph>
    </Descriptions.Item>
    <Descriptions.Item
      span={2}
      label={formatMessage({ id: "table.annotations" })}
    >
      <Typography.Paragraph ellipsis={{ rows: 2, expandable: "collapsible" }}>
        {formatAnnotations(metadata?.annotations)}
      </Typography.Paragraph>
    </Descriptions.Item>
    <Descriptions.Item span={2} label={formatMessage({ id: "table.env" })}>
      <Typography.Paragraph ellipsis={{ rows: 3, expandable: "collapsible" }}>
        {spec?.containers?.map((container: IContainer) => (
          <>
            {container.env?.map((env: any) => {
              return (
                <div key={env.name}>
                  <Tag key={env.name} color="blue">
                    {env.name}
                  </Tag>
                  {": "}
                  {env.value}
                </div>
              );
            }) || "-"}
          </>
        ))}
      </Typography.Paragraph>
    </Descriptions.Item>
    <Descriptions.Item span={2} label={formatMessage({ id: "table.volume" })}>
      <Typography.Paragraph ellipsis={{ rows: 3, expandable: "collapsible" }}>
        {spec?.containers?.map((container: IContainer) => (
          <>
            {container.volumeMounts?.map(
              (volume: IVolumeMount, index: number) => {
                return (
                  <div key={`${volume.name}-${index}`}>
                    <Tag key={volume.name} color="blue">
                      {volume.name}
                    </Tag>
                    {": "}
                    {volume.mountPath}
                    {"  "}
                    <Tag color={volume.readOnly ? "green" : "red"}>
                      {volume.readOnly ? "Read Only" : "Read Write"}
                    </Tag>
                  </div>
                );
              }
            ) || "-"}
          </>
        ))}
      </Typography.Paragraph>
    </Descriptions.Item>
  </Descriptions>
);

interface StatusInfoProps {
  formatMessage: FormatMessageFunction;
  status: any;
}

const StatusInfo: React.FC<StatusInfoProps> = ({ formatMessage, status }) => (
  <Descriptions bordered column={2} size="small">
    <Descriptions.Item label={formatMessage({ id: "table.status" })}>
      {status?.phase}
    </Descriptions.Item>
    {status.conditions?.map((condition: any) => (
      <Descriptions.Item label={condition.type}>
        {condition.status}
      </Descriptions.Item>
    ))}
  </Descriptions>
);

interface PodDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  namespace: string;
}

interface ModalState {
  edit: boolean;
  diff: boolean;
  renderSideBySide: boolean;
  showDiff: boolean;
}

// Enhanced type definitions
type FormatMessageFunction = (descriptor: any) => string;

const PodDetailDrawer: React.FC<PodDetailDrawerProps> = ({
  visible,
  onClose,
  name,
  namespace,
}) => {
  // Core data state
  const [pod, setPod] = useState<Pod | null>(null);

  // Modal state
  const [modalState, setModalState] = useState<ModalState>({
    edit: false,
    diff: false,
    renderSideBySide: false,
    showDiff: false,
  });

  // Refs and hooks
  const { formatMessage } = useLocale();
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [modal, contextHolder] = Modal.useModal();
  const customEditRef = useRef<CustomEditRef>(null);
  const [events, setEvents] = useState<Array<Event>>([]);

  const fetchEvents = async () => {
    await getEventsByResource(name, namespace, "Pod").then((res) => {
      setEvents(sortEventsByTimestamp(res));
    });
  };
  useEffect(() => {
    fetchEvents();
  }, [pod]);

  const getPodByName = async () => {
    const res = await getPod(name, namespace);
    setPod(res);
  };

  const refresh = async () => {
    await getPodByName();
  };

  useEffect(() => {
    if (visible && name && namespace) {
      getPodByName();
    }
  }, [visible, name, namespace]);

  if (!pod) return null;
  const { metadata, spec, status } = pod;

  const handleDelete = (name: string, namespace: string) => {
    modal.confirm({
      title: formatMessage({ id: "button.delete" }),
      content: (
        <span>
          {formatMessage({ id: "button.confirm_delete" })} Pod{" "}
          <span style={{ color: "red" }}>{name}</span> ?
        </span>
      ),
      okText: formatMessage({ id: "button.confirm" }),
      cancelText: formatMessage({ id: "button.cancel" }),
      okButtonProps: { size: "small" },
      cancelButtonProps: { size: "small" },
      onOk: async () => {
        try {
          await deletePod(name, namespace);
          messageApi.success(formatMessage({ id: "message.success" }));
          refresh();
          handleCancel();
        } catch (error) {
          messageApi.error(`${formatMessage({ id: "message.error" })}`);
          handleCancel();
          visible = false;
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

  return (
    <>
      <ViewYaml
        data={pod}
        name={metadata?.name!}
        visible={modalState.edit}
        handleCancel={handleCancel}
      />
      <Drawer
        mask={false}
        title={
          <Space>
            <MyIcon type="icon-pod" size={18} color="#1677ff" />
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
            refresh={refresh}
            onDelete={() => handleDelete(metadata?.name!, metadata?.namespace!)}
          />
        }
      >
        {contextHolder}
        {contextHolderMessage}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Divider orientation="left" style={{ marginTop: 0 }}>
              {formatMessage({ id: "table.basic" })}
            </Divider>
            <BasicInfo
              formatMessage={formatMessage}
              metadata={metadata}
              spec={spec}
              status={status}
            />
          </Col>

          <Col span={24}>
            <Divider orientation="left">
              {formatMessage({ id: "table.state" })}
            </Divider>
            <StatusInfo formatMessage={formatMessage} status={status} />
          </Col>
          <Col span={24}>
            <Divider orientation="left">
              {formatMessage({ id: "table.containers" })}
            </Divider>
            <Container pod={pod} />
          </Col>
          <Col span={24}>
            <Divider orientation="left">
              {formatMessage({ id: "table.event" })}
            </Divider>

            <Table
              tableLayout="auto"
              scroll={{ y: 200 }}
              columns={getPodTableColumns(formatMessage)}
              dataSource={events}
              rowKey={(record) => record.metadata?.name || ""}
              pagination={false}
            />
          </Col>
        </Row>
      </Drawer>
    </>
  );
};

export default PodDetailDrawer;
