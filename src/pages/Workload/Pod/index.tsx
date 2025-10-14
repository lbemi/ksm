import { useAppSelector } from "@/store/hook";
import { Button, TableProps, Tag, Dropdown, Modal, message } from "antd";
import { Pod, IPodStatus } from "kubernetes-models/v1";
import { FC, useEffect, useRef, useState } from "react";
import {
  SyncOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  CheckCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Typography } from "antd";
import { IContainerStatus } from "kubernetes-models/v1/ContainerStatus";
import { IIoK8sApiCoreV1PodCondition } from "kubernetes-models/v1/PodCondition";
import { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from "@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta";
import { dateFormat } from "@/utils/k8s/date";
import { kubernetes_request } from "@/api/cluster";
import CustomContent from "@/components/CustomContent";
import CustomFooter, { CustomFooterRef } from "@/components/Footer";
import Link from "antd/es/typography/Link";
import PodDetailDrawer from "@/components/PodDetail";
import { deletePod } from "@/api/pod";
import { useLocale } from "@/locales";
import ViewYaml from "@/components/ViewYaml";
const { Text } = Typography;

const PodPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [pods, setPods] = useState<Array<Pod>>([]);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const footerRef = useRef<CustomFooterRef>(null);
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [yamlVisible, setYamlVisible] = useState(false);
  const [yamlData, setYamlData] = useState<Pod | null>(null);
  const [modal, contextHolder] = Modal.useModal();
  const { formatMessage } = useLocale();
  const handleShowDetail = (pod: Pod) => {
    setSelectedPod(pod);
    setDrawerVisible(true);
  };
  const handleShowYaml = (pod: Pod) => {
    setYamlData(pod);
    console.log("yamlData--", yamlData);
    setYamlVisible(true);
  };
  const columns: TableProps<Pod>["columns"] = [
    {
      title: formatMessage({ id: "table.name" }),
      dataIndex: ["metadata", "name"],
      key: "name",
      width: 250,
      fixed: "left",
      render: (text, record) => (
        <Text ellipsis={{ tooltip: `${text}` }}>
          <Link onClick={() => handleShowDetail(record)}>{text}</Link>
        </Text>
      ),
    },
    ...(namespace === "all"
      ? [
          {
            title: formatMessage({ id: "table.namespace" }),
            dataIndex: ["metadata", "namespace"],
            key: "namespace",
            render: (text: string) => <div>{text}</div>,
          },
        ]
      : []),
    {
      title: formatMessage({ id: "table.status" }),
      dataIndex: ["status"],
      key: "status",
      width: 130,
      align: "center",
      render: (status, record) => (
        <div>{formatterPodStatus(status, record)}</div>
      ),
    },
    {
      title: formatMessage({ id: "table.pod_ip" }),
      dataIndex: ["status", "podIP"],
      align: "center",
      key: "ip",
      render: (text) => <div>{text}</div>,
    },

    {
      title: formatMessage({ id: "table.node_ip" }),
      dataIndex: ["status", "hostIP"],
      align: "center",
      key: "hostIP",
      render: (hostIP) => <div>{hostIP}</div>,
    },
    {
      title: formatMessage({ id: "table.age" }),
      dataIndex: "metadata",
      key: "creationTimestamp",
      render: (metadata: IIoK8sApimachineryPkgApisMetaV1ObjectMeta) => {
        // if (metadata.creationTimestamp) {
        //   return getAge(metadata.creationTimestamp);
        // }
        return dateFormat(metadata.creationTimestamp);
      },
    },
    {
      title: formatMessage({ id: "table.action" }),
      key: "action",
      fixed: "right",
      dataIndex: "action",
      width: 100,
      render: (_, record: Pod) => (
        <div className="action-buttons">
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
                  label: formatMessage({ id: "button.yaml" }),
                  icon: <EditOutlined />,
                  onClick: () => handleShowYaml(record),
                },
                {
                  key: "delete",
                  label: formatMessage({ id: "button.delete" }),
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () =>
                    handleDelete(
                      record.metadata?.name!,
                      record.metadata?.namespace!
                    ),
                },
                { type: "divider" },
                {
                  key: "terminal",
                  label: formatMessage({ id: "button.terminal" }),
                  icon: <SettingOutlined />,
                  onClick: () =>
                    onAdd(
                      "ssh",
                      record.metadata?.name || "",
                      record.metadata?.namespace || ""
                    ),
                },
                {
                  key: "logs",
                  label: formatMessage({ id: "button.log" }),
                  icon: <SettingOutlined />,
                  onClick: () =>
                    onAdd(
                      "log",
                      record.metadata?.name || "",
                      record.metadata?.namespace || ""
                    ),
                },
              ],
            }}
          >
            <Button type="link" size="small">
              {formatMessage({ id: "button.more" })} <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      ),
    },
  ];

  const [messageApi, contextHolderMessage] = message.useMessage();
  const formatterPodStatus = (status: IPodStatus, pod: Pod) => {
    if (pod.metadata && pod.metadata.deletionTimestamp) {
      return (
        <div>
          <Tag
            bordered={false}
            icon={<SyncOutlined spin={true} />}
            color="volcano"
          >
            Terminating
          </Tag>
        </div>
      );
    }
    let phase = status.phase;
    switch (phase) {
      case "Failed":
        if (status.reason) {
          return formatterIcon("error", status.reason || "");
        }
        return formatterIcon(
          "error",
          getContainerStatuses(status, false) || ""
        );
      case "Pending":
        return formatterIcon(
          "magenta",
          getContainerStatuses(status, true) || ""
        );
      case "Succeeded":
        return formatterIcon(
          "geekblue",
          getContainerStatuses(status, false) || ""
        );
      case "Running":
        if (
          status.conditions &&
          status.conditions.filter(
            (s: IIoK8sApiCoreV1PodCondition) => s.status !== "True"
          ).length > 0
        ) {
          return formatterIcon(
            "error",
            getContainerStatuses(status, true) || ""
          );
        }
        return formatterIcon("green", phase || "");
      default:
        return formatterIcon("error", phase || "");
    }
  };
  const getContainerStatuses = (data: IPodStatus, pending: boolean) => {
    let containers = [
      ...(data.initContainerStatuses || []),
      ...(data.containerStatuses || []),
    ];
    containers = containers.filter((s) => !s.ready);
    const waiting = containers.find((s) => s.state!.waiting);
    const terminated = containers.find((s) => s.state!.terminated);

    if (pending) {
      const init = (data.initContainerStatuses || []).filter(
        (s: IContainerStatus) => s.ready
      ).length;
      if (init === (data.initContainerStatuses || []).length) {
        return containers.length === 0
          ? "Pending"
          : waiting
            ? waiting.state!.waiting!.reason
            : terminated
              ? terminated.state!.terminated!.reason
              : "Pending";
      }
      return `Init:${init}/${
        data.initContainerStatuses ? data.initContainerStatuses.length : 0
      }`;
    }

    return containers.length === 0
      ? "unknown"
      : waiting
        ? waiting.state!.waiting!.reason
        : terminated
          ? terminated.state!.terminated!.reason
          : "unknown";
  };
  const formatterIcon = (color: string, text: string) => {
    return (
      <>
        <Tag
          bordered={false}
          icon={
            text === "Completed" ? (
              <CheckCircleOutlined />
            ) : (
              <SyncOutlined
                spin={
                  text === "Running" ||
                  text === "ContainerCreating" ||
                  text === "Pending"
                }
              />
            )
          }
          color={color}
        >
          {text}
        </Tag>
      </>
    );
  };

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
          list_pods();
        } catch (error) {
          messageApi.error(`${formatMessage({ id: "message.error" })}`);
        }
      },
    });
  };

  const list_pods = async (refresh = false) => {
    if (!refresh) {
      setLoading(true);
    }
    let url: string;
    if (namespace === "all") {
      url = "/api/v1/pods";
    } else {
      url = "/api/v1/namespaces/" + namespace + "/pods";
    }
    try {
      const res = await kubernetes_request<Array<Pod>>("GET", url);
      setPods(res);
    } catch (error) {
      message.error(formatMessage({ id: "message.error" }));
    } finally {
      if (!refresh) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    list_pods();
    const interval = setInterval(async () => {
      await list_pods(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [namespace]);

  const getFilteredPods = (searchText: string) => {
    if (searchText === "" || typeof searchText !== "string") return pods;

    return pods.filter((pod) => {
      const name = pod.metadata?.name?.toLowerCase() || "";
      const status = pod.status?.phase?.toLowerCase() || "";
      const ip = pod.status?.podIP?.toLowerCase() || "";
      const node = pod.status?.hostIP?.toLowerCase() || "";
      const searchLower = searchText.toLowerCase();

      return (
        name.includes(searchLower) ||
        status.includes(searchLower) ||
        ip.includes(searchLower) ||
        node.includes(searchLower)
      );
    });
  };

  const onAdd = (action: "log" | "ssh", name: string, namespace: string) => {
    footerRef.current?.add(action, name, namespace);
  };

  return (
    <>
      {contextHolderMessage}
      {contextHolder}
      <ViewYaml
        data={yamlData}
        name={yamlData?.metadata?.name || ""}
        visible={yamlVisible}
        handleCancel={() => {
          setYamlVisible(false);
          setYamlData(null);
        }}
      />
      <CustomContent
        columns={columns}
        refresh={list_pods}
        filter={getFilteredPods}
        total={pods.length}
        loading={loading}
      >
        <CustomFooter ref={footerRef} />
      </CustomContent>

      <PodDetailDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        name={selectedPod?.metadata?.name || ""}
        namespace={selectedPod?.metadata?.namespace || ""}
      />
    </>
  );
};

export default PodPage;
