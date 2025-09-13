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
import { ConfigMap } from "kubernetes-models/v1";
import getAge from "@/utils/k8s/date";
import CustomContent from "@/components/CustomContent";

const ConfigMapPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [configMaps, setConfigMaps] = useState<Array<ConfigMap>>([]);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const { Paragraph } = Typography;

  const columns: TableProps<ConfigMap>["columns"] = [
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
      title: "Age",
      dataIndex: "metadata",
      key: "creationTimestamp",
      render: (metadata) => {
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
      render: (_, record: ConfigMap) => (
        <div>
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
                  onClick: () => handleDeleteConfigMap(record),
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

  const handleDeleteConfigMap = (configMap: ConfigMap) => {
    Modal.confirm({
      title: "确认删除",
      content: (
        <span>
          您确定要删除 ConfigMap{" "}
          <span style={{ color: "red" }}>{configMap.metadata?.name}</span> 吗？
        </span>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await kubernetes_request(
            "DELETE",
            `/api/v1/namespaces/${configMap.metadata?.namespace}/configmaps/${configMap.metadata?.name}`
          );
          message.success(`ConfigMap ${configMap.metadata?.name} 删除成功`);
          list_configMaps();
        } catch (error) {
          message.error(`删除失败: ${error}`);
        }
      },
    });
  };

  const list_configMaps = () => {
    setLoading(true);
    let url: string;
    if (namespace === "all") {
      url = "/api/v1/configmaps";
    } else {
      url = `/api/v1/namespaces/${namespace}/configmaps`;
    }
    kubernetes_request<Array<ConfigMap>>("GET", url)
      .then((res) => {
        setConfigMaps(res);
      })
      .catch((err) => {
        console.log("err: ", err);
      });
    setLoading(false);
  };

  useEffect(() => {
    list_configMaps();
  }, [namespace]);

  const filteredConfigMaps = (searchText: string) => {
    if (searchText === "" || typeof searchText !== "string") return configMaps;
    const filterText = searchText.toLowerCase();
    return configMaps.filter((configMap: ConfigMap) =>
      configMap.metadata!.name!.toLowerCase().includes(filterText)
    );
  };

  return (
    <>
      <CustomContent
        columns={columns}
        refresh={list_configMaps}
        filter={filteredConfigMaps}
        loading={loading}
      />
    </>
  );
};

export default ConfigMapPage;
