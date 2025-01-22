import { useAppSelector } from "@/store/hook";
import { Button, TableProps, Tag, Dropdown, Modal, message } from "antd";
import { Pod, IPodStatus } from "kubernetes-models/v1";
import { FC, useEffect, useState } from "react";
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
import getAge from "@/utils/k8s/date";
import { kubernetes_request } from "@/api/cluster";
import { getImages } from "@/utils/k8s/tools.tsx";
import CustomContent from "@/components/CustomContent";
import { invoke } from "@tauri-apps/api/core";
import CustomEdit from "@/components/CustomEdit";

const PodPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [pods, setPods] = useState<Array<Pod>>([]);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const [log, setLog] = useState("等待日志.... \n");
  const columns: TableProps<Pod>["columns"] = [
    {
      title: "名称",
      dataIndex: ["metadata", "name"],
      key: "name",
      width: 250,
      fixed: "left",
      render: (text) => (
        <div className="table-name-cell">
          <Paragraph
            copyable={{
              text: text,
              tooltips: ["复制名称", "已复制"],
            }}
            style={{ marginRight: 8, marginBottom: 0 }}
          />
          <span className="table-name-text" title={text}>
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
      dataIndex: ["status"],
      key: "status",
      width: 120,
      render: (status, record) => (
        <div>{formatterPodStatus(status, record)}</div>
      ),
    },
    {
      title: "容器IP",
      dataIndex: ["status", "podIP"],
      key: "ip",
      render: (text) => <div>{text}</div>,
    },
    {
      title: "镜像",
      dataIndex: ["spec", "containers"],
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
      title: "所在节点",
      dataIndex: ["status", "hostIP"],
      key: "hostIP",
      render: (hostIP) => <div>{hostIP}</div>,
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
      render: (_, record: Pod) => (
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
                  onClick: () => handleDeletePod(record),
                },
                { type: "divider" },
                { key: "terminal", label: "终端", icon: <SettingOutlined /> },
                {
                  key: "logs",
                  label: "日志",
                  icon: <SettingOutlined />,
                  onClick: () => handleLog(record),
                },
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

  const { Paragraph } = Typography;

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

  const handleDeletePod = (pod: Pod) => {
    Modal.confirm({
      title: "确认删除",
      content: (
        <span>
          您确定要删除 Pod{" "}
          <span style={{ color: "red" }}>{pod.metadata?.name}</span> 吗？
        </span>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await kubernetes_request(
            "DELETE",
            `/api/v1/namespaces/${pod.metadata?.namespace}/pods/${pod.metadata?.name}`
          );
          message.success(`Pod ${pod.metadata?.name} 删除成功`);
          list_pods();
        } catch (error) {
          message.error(`删除失败: ${error}`);
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
      message.error("获取Pod列表失败");
    } finally {
      if (!refresh) {
        setLoading(false);
      }
    }
  };
  const handleLog = async (pod: Pod) => {
    setLog("");
    try {
      await invoke("connect_websocket", {
        podLogStream: {
          namespace: pod.metadata?.namespace || "default",
          container: pod.spec?.containers?.[0]?.name || "",
          tail: 50,
          follow: true,
          timestamps: false,
          pod: pod.metadata?.name || "",
        },
      });

      const ws = new WebSocket("ws://localhost:38012");

      ws.addEventListener("open", (e) => {
        console.log("open", e);
      });
      ws.addEventListener("message", (e) => {
        console.log("message", e.data);
      });
      ws.addEventListener("close", () => {
        console.log("close");
      });
      ws.addEventListener("error", () => {
        console.log("error");
      });
      // const ws = await WebSocket.connect("ws://localhost:38012");
      // let text = "";

      // ws.addListener((msg) => {
      //   console.log("msg", msg.data);
      //   // text = text + msg.data?.toString() + "\n";
      //   // setLog(text);
      // });

      // // 保存 WebSocket 实例以便后续清理
      // return () => {
      //   console.log("disconnect");
      //   ws.disconnect();
      // };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      message.error("连接日志失败");
    }
  };

  useEffect(() => {
    list_pods();
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

  const deletePods = () => {
    setTimeout(() => {
      console.log("deletePods--");
      // setSelectedRowKeys([]);
    }, 1000);
  };

  return (
    <>
      <CustomContent
        columns={columns}
        refresh={list_pods}
        del={deletePods}
        filter={getFilteredPods}
        loading={loading}
      >
        {/* <CustomEdit data={log} type="json" scrollEnd /> */}
        {/* <CustomFooter /> */}
      </CustomContent>
    </>
  );
};

export default PodPage;
