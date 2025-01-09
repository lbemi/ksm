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
import { Typography } from "antd";
import { kubernetes_request } from "@/api/cluster";
import { DaemonSet } from "kubernetes-models/apps/v1";
import { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from "@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta";
import getAge from "@/utils/k8s/date";
import { getImages } from "@/utils/k8s/tools.tsx";
import CustomContent from "@/components/CustomContent";

const DaemonSetPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [daemonSets, setDaemonSets] = useState<Array<DaemonSet>>([]);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const { Paragraph } = Typography;

  const columns: TableProps<DaemonSet>["columns"] = [
    {
      title: "名称",
      dataIndex: ["metadata", "name"],
      key: "name",
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
      key: "status",
      render: (record: DaemonSet) => {
        const status = getDaemonSetStatus(record);
        return <span style={{ color: status.color }}>{status.text}</span>;
      },
    },
    {
      title: "副本数(正常/异常)",
      dataIndex: ["status", "numberReady"],
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
      render: (_, record: DaemonSet) => (
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
                  onClick: () => handleDeleteDaemonSet(record),
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

  const getDaemonSetStatus = (daemonSet: DaemonSet) => {
    const status = daemonSet.status;
    if (!status) return { text: "Unknown", color: "gray" };

    const { numberReady = 0, desiredNumberScheduled = 0 } = status;

    if (numberReady < desiredNumberScheduled) {
      return { text: "Pending", color: "orange" };
    }

    return { text: "Running", color: "green" };
  };

  const handleDeleteDaemonSet = (daemonSet: DaemonSet) => {
    Modal.confirm({
      title: "确认删除",
      content: (
        <span>
          您确定要删除 DaemonSet{" "}
          <span style={{ color: "red" }}>{daemonSet.metadata?.name}</span> 吗？
        </span>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await kubernetes_request(
            "DELETE",
            `/apis/apps/v1/namespaces/${daemonSet.metadata?.namespace}/daemonsets/${daemonSet.metadata?.name}`
          );
          message.success(`DaemonSet ${daemonSet.metadata?.name} 删除成功`);
          list_daemonsets();
        } catch (error) {
          message.error(`删除失败: ${error}`);
        }
      },
    });
  };

  const list_daemonsets = () => {
    setLoading(true);
    let url =
      namespace === "all"
        ? "/apis/apps/v1/daemonsets"
        : `/apis/apps/v1/namespaces/${namespace}/daemonsets`;
    kubernetes_request<Array<DaemonSet>>("GET", url)
      .then((res) => {
        setDaemonSets(res);
      })
      .catch((err) => {
        console.log("err: ", err);
      });
    setLoading(false);
  };

  useEffect(() => {
    list_daemonsets();
  }, [namespace]);

  const getFilteredDaemonSets = (searchText: string) => {
    if (searchText === "" || typeof searchText !== "string") return daemonSets;

    return daemonSets.filter((daemonSet: DaemonSet) => {
      const name = daemonSet.metadata!.name!.toLowerCase() || "";
      const searchLower = searchText ? searchText.toLowerCase() : "";

      return name.includes(searchLower);
    });
  };

  return (
    <>
      <CustomContent
        columns={columns}
        refresh={list_daemonsets}
        filter={getFilteredDaemonSets}
        loading={loading}
      />
    </>
  );
};

export default DaemonSetPage;
