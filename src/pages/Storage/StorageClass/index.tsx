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
import getAge from "@/utils/k8s/date";
import { StorageClass } from "kubernetes-models/storage.k8s.io/v1";
import CustomContent from "@/components/CustomContent";

const StorageClassPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [storageClasses, setStorageClasses] = useState<Array<StorageClass>>([]);
  const { Paragraph } = Typography;

  const columns: TableProps<StorageClass>["columns"] = [
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
    {
      title: "Provisioner",
      dataIndex: "provisioner",
      key: "provisioner",
      render: (text: string) => <div>{text}</div>,
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
      render: (_, record: StorageClass) => (
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
                  onClick: () => handleDeleteStorageClass(record),
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

  const handleDeleteStorageClass = (storageClass: StorageClass) => {
    Modal.confirm({
      title: "确认删除",
      content: (
        <span>
          您确定要删除 StorageClass{" "}
          <span style={{ color: "red" }}>{storageClass.metadata?.name}</span>{" "}
          吗？
        </span>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await kubernetes_request(
            "DELETE",
            `/apis/storage.k8s.io/v1/storageclasses/${storageClass.metadata?.name}`
          );
          message.success(
            `StorageClass ${storageClass.metadata?.name} 删除成功`
          );
          list_storageClasses();
        } catch (error) {
          message.error(`删除失败: ${error}`);
        }
      },
    });
  };

  const list_storageClasses = () => {
    setLoading(true);
    kubernetes_request<Array<StorageClass>>(
      "GET",
      "/apis/storage.k8s.io/v1/storageclasses"
    )
      .then((res) => {
        setStorageClasses(res);
      })
      .catch((err) => {
        console.log("err: ", err);
      });
    setLoading(false);
  };

  useEffect(() => {
    list_storageClasses();
  }, []);

  return (
    <>
      <CustomContent
        loading={loading}
        columns={columns}
        refresh={list_storageClasses}
        filter={() => storageClasses} // 可以根据需要添加过滤功能
        disableNamespace
      />
    </>
  );
};

export default StorageClassPage;
