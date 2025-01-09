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
import { StatefulSet } from "kubernetes-models/apps/v1";
import { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from "@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta";
import getAge from "@/utils/k8s/date";
import { getImages } from "@/utils/k8s/tools.tsx";
import CustomContent from "@/components/CustomContent";

const StatefulSetPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [statefulSets, setStatefulSets] = useState<Array<StatefulSet>>([]);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const { Paragraph } = Typography;

  const columns: TableProps<StatefulSet>["columns"] = [
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
      render: (record: StatefulSet) => {
        const status = getStatefulSetStatus(record);
        return <span style={{ color: status.color }}>{status.text}</span>;
      },
    },
    {
      title: "副本数(正常/异常)",
      dataIndex: ["spec", "replicas"],
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
      render: (_, record: StatefulSet) => (
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
                  onClick: () => handleDeleteStatefulSet(record),
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

  const getStatefulSetStatus = (statefulSet: StatefulSet) => {
    const status = statefulSet.status;
    if (!status) return { text: "Unknown", color: "gray" };

    const { replicas = 0, readyReplicas = 0 } = status;

    if (replicas === 0) {
      return { text: "Stopped", color: "red" };
    }

    if (readyReplicas === replicas) {
      return { text: "Running", color: "green" };
    }

    return { text: "Pending", color: "orange" };
  };

  const handleDeleteStatefulSet = (statefulSet: StatefulSet) => {
    Modal.confirm({
      title: "确认删除",
      content: (
        <span>
          您确定要删除 StatefulSet{" "}
          <span style={{ color: "red" }}>{statefulSet.metadata?.name}</span>{" "}
          吗？
        </span>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await kubernetes_request(
            "DELETE",
            `/apis/apps/v1/namespaces/${statefulSet.metadata?.namespace}/statefulsets/${statefulSet.metadata?.name}`
          );
          message.success(`StatefulSet ${statefulSet.metadata?.name} 删除成功`);
          list_statefulsets();
        } catch (error) {
          message.error(`删除失败: ${error}`);
        }
      },
    });
  };

  const list_statefulsets = () => {
    setLoading(true);
    let url =
      namespace === "all"
        ? "/apis/apps/v1/statefulsets"
        : `/apis/apps/v1/namespaces/${namespace}/statefulsets`;
    kubernetes_request<Array<StatefulSet>>("GET", url)
      .then((res) => {
        setStatefulSets(res);
      })
      .catch((err) => {
        console.log("err: ", err);
      });
    setLoading(false);
  };

  useEffect(() => {
    list_statefulsets();
  }, [namespace]);

  const getFilteredStatefulSets = (searchText: string) => {
    if (searchText === "" || typeof searchText !== "string")
      return statefulSets;

    return statefulSets.filter((statefulSet: StatefulSet) => {
      const name = statefulSet.metadata!.name!.toLowerCase() || "";
      const searchLower = searchText ? searchText.toLowerCase() : "";

      return name.includes(searchLower);
    });
  };

  return (
    <>
      <CustomContent
        columns={columns}
        refresh={list_statefulsets}
        del={() => {}}
        filter={getFilteredStatefulSets}
        loading={loading}
      />
    </>
  );
};

export default StatefulSetPage;
