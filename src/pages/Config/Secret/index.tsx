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
import { kubeApi, kubernetes_request } from "@/api/cluster";
import { Secret } from "kubernetes-types/core/v1";
import getAge from "@/utils/k8s/date";
import CustomContent from "@/components/CustomContent";
const SecretPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [secrets, setSecrets] = useState<Array<Secret>>([]);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const { Paragraph } = Typography;

  const columns: TableProps<Secret>["columns"] = [
    {
      title: "名称",
      dataIndex: ["metadata", "name"],
      key: "uid",
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
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (text) => <div>{text}</div>,
    },
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
      render: (_, record: Secret) => (
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
                  onClick: () => handleDeleteSecret(record),
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

  const handleDeleteSecret = (secret: Secret) => {
    Modal.confirm({
      title: "确认删除",
      content: (
        <span>
          您确定要删除 Secret{" "}
          <span style={{ color: "red" }}>{secret.metadata?.name}</span> 吗？
        </span>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await kubernetes_request(
            "DELETE",
            `/api/v1/namespaces/${secret.metadata?.namespace}/secrets/${secret.metadata?.name}`
          );
          message.success(`Secret ${secret.metadata?.name} 删除成功`);
          list_secrets();
        } catch (error) {
          message.error(`删除失败: ${error}`);
        }
      },
    });
  };

  const list_secrets = async () => {
    setLoading(true);

    await kubeApi
      .get<Secret>("secrets", namespace)
      .then((res) => {
        setSecrets(res);
      })
      .catch((err) => {
        console.log("err: ", err);
      });

    setLoading(false);
  };

  useEffect(() => {
    list_secrets();
  }, [namespace]);

  const filteredSecrets = (searchText: string) => {
    if (searchText === "" || typeof searchText !== "string") return secrets;
    const filterText = searchText.toLowerCase();
    return secrets.filter((secret: Secret) =>
      secret.metadata!.name!.toLowerCase().includes(filterText)
    );
  };

  return (
    <>
      <CustomContent
        loading={loading}
        columns={columns}
        refresh={list_secrets}
        filter={filteredSecrets}
      />
    </>
  );
};

export default SecretPage;
