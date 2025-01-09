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
import { Job } from "kubernetes-models/batch/v1";
import getAge from "@/utils/k8s/date";
import CustomContent from "@/components/CustomContent";

const JobPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Array<Job>>([]);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const { Paragraph } = Typography;

  const columns: TableProps<Job>["columns"] = [
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
      render: (status) => <div>{status?.conditions?.[0]?.type}</div>, // 根据需要调整状态字段
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
      render: (_, record: Job) => (
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
                  onClick: () => handleDeleteJob(record),
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

  const handleDeleteJob = (job: Job) => {
    Modal.confirm({
      title: "确认删除",
      content: (
        <span>
          您确定要删除 Job{" "}
          <span style={{ color: "red" }}>{job.metadata?.name}</span> 吗？
        </span>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await kubernetes_request(
            "DELETE",
            `/apis/batch/v1/namespaces/${job.metadata?.namespace}/jobs/${job.metadata?.name}`
          );
          message.success(`Job ${job.metadata?.name} 删除成功`);
          list_jobs();
        } catch (error) {
          message.error(`删除失败: ${error}`);
        }
      },
    });
  };

  const list_jobs = () => {
    setLoading(true);
    let url: string;
    if (namespace === "all") {
      url = "/apis/batch/v1/jobs";
    } else {
      url = `/apis/batch/v1/namespaces/${namespace}/jobs`;
    }
    kubernetes_request<Array<Job>>("GET", url)
      .then((res) => {
        setJobs(res);
      })
      .catch((err) => {
        console.log("err: ", err);
      });
    setLoading(false);
  };

  useEffect(() => {
    list_jobs();
  }, [namespace]);

  return (
    <>
      <CustomContent
        loading={loading}
        columns={columns}
        refresh={list_jobs}
        filter={() => jobs} // 可以根据需要添加过滤功能
      />
    </>
  );
};

export default JobPage;
