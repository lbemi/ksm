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
import { PersistentVolume } from "kubernetes-models/v1";
import getAge from "@/utils/k8s/date";
import CustomContent from "@/components/CustomContent";

const PersistentVolumePage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [persistentVolumes, setPersistentVolumes] = useState<
    Array<PersistentVolume>
  >([]);
  const { Paragraph } = Typography;

  const columns: TableProps<PersistentVolume>["columns"] = [
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
      title: "容量",
      dataIndex: "spec",
      key: "capacity",
      render: (spec) => <div>{spec?.capacity?.["storage"]}</div>,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status) => <div>{status?.phase}</div>,
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
      render: (_, record: PersistentVolume) => (
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
                  onClick: () => handleDeletePersistentVolume(record),
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

  const handleDeletePersistentVolume = (persistentVolume: PersistentVolume) => {
    Modal.confirm({
      title: "确认删除",
      content: (
        <span>
          您确定要删除 PersistentVolume{" "}
          <span style={{ color: "red" }}>
            {persistentVolume.metadata?.name}
          </span>{" "}
          吗？
        </span>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await kubernetes_request(
            "DELETE",
            `/api/v1/persistentvolumes/${persistentVolume.metadata?.name}`
          );
          message.success(
            `PersistentVolume ${persistentVolume.metadata?.name} 删除成功`
          );
          list_persistentVolumes();
        } catch (error) {
          message.error(`删除失败: ${error}`);
        }
      },
    });
  };

  const list_persistentVolumes = () => {
    setLoading(true);
    kubernetes_request<Array<PersistentVolume>>(
      "GET",
      "/api/v1/persistentvolumes"
    )
      .then((res) => {
        setPersistentVolumes(res);
      })
      .catch((err) => {
        console.log("err: ", err);
      });
    setLoading(false);
  };

  useEffect(() => {
    list_persistentVolumes();
  }, []);

  return (
    <>
      <CustomContent
        loading={loading}
        columns={columns}
        refresh={list_persistentVolumes}
        filter={() => persistentVolumes} // 可以根据需要添加过滤功能
        disableNamespace
      />
    </>
  );
};

export default PersistentVolumePage;
