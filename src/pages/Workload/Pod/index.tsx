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
import MyTable from "@/components/MyTable";
import { getImages } from "@/utils/k8s/tools.tsx";

const PodPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [pods, setPods] = useState<Array<Pod>>([]);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
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

  const list_pods = () => {
    setLoading(true);
    let url: string;
    if (namespace === "all") {
      url = "/api/v1/pods";
    } else {
      url = "/api/v1/namespaces/" + namespace + "/pods";
    }
    kubernetes_request<Array<Pod>>("GET", url)
      .then((res) => {
        setPods(res);
      })
      .catch((err) => {
        console.log("err: ", err);
      });
    setLoading(false);
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
      <MyTable
        columns={columns}
        refresh={list_pods}
        del={deletePods}
        filter={getFilteredPods}
        loading={loading}
      />
    </>
  );
};

export default PodPage;
