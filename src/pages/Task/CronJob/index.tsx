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
import { CronJob } from "kubernetes-models/batch/v1beta1";
import getAge from "@/utils/k8s/date";
import CustomContent from "@/components/CustomContent";

const CronJobPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [cronJobs, setCronJobs] = useState<Array<CronJob>>([]);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const { Paragraph } = Typography;

  const columns: TableProps<CronJob>["columns"] = [
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
      dataIndex: "status",
      key: "status",
      render: (status) => <div>{status?.active ? "Running" : "Stopped"}</div>, // 根据需要调整状态字段
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
      render: (_, record: CronJob) => (
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
                  onClick: () => handleDeleteCronJob(record),
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

  const handleDeleteCronJob = (cronJob: CronJob) => {
    Modal.confirm({
      title: "确认删除",
      content: (
        <span>
          您确定要删除 CronJob{" "}
          <span style={{ color: "red" }}>{cronJob.metadata?.name}</span> 吗？
        </span>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await kubernetes_request(
            "DELETE",
            `/apis/batch/v1beta1/namespaces/${cronJob.metadata?.namespace}/cronjobs/${cronJob.metadata?.name}`
          );
          message.success(`CronJob ${cronJob.metadata?.name} 删除成功`);
          list_cronJobs();
        } catch (error) {
          message.error(`删除失败: ${error}`);
        }
      },
    });
  };

  const list_cronJobs = () => {
    setLoading(true);
    let url: string;
    if (namespace === "all") {
      url = "/apis/batch/v1beta1/cronjobs";
    } else {
      url = `/apis/batch/v1beta1/namespaces/${namespace}/cronjobs`;
    }
    kubernetes_request<Array<CronJob>>("GET", url)
      .then((res) => {
        setCronJobs(res);
      })
      .catch((err) => {
        console.log("err: ", err);
      });
    setLoading(false);
  };

  useEffect(() => {
    list_cronJobs();
  }, [namespace]);

  return (
    <>
      <CustomContent
        loading={loading}
        columns={columns}
        refresh={list_cronJobs}
        filter={() => cronJobs} // 可以根据需要添加过滤功能
      />
    </>
  );
};

export default CronJobPage;
