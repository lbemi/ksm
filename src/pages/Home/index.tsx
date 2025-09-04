import { message, Table, TableProps, Tag, theme } from "antd";
import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { Cluster } from "@/types/cluster";
import { useAppDispatch } from "@/store/hook";
import { setActiveCluster } from "@/store/modules/kubernetes";
import { Typography } from "antd";
import "./index.scss";
import { useLocale } from "@/locales";

const { Title } = Typography;

export const Home: FC = () => {
  const { formatMessage } = useLocale();
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);

  const redirect = async (record: Cluster) => {
    invoke("switch_cluster", { clusterName: record.name })
      .then(() => {
        dispatch(setActiveCluster(record.name));
        navigate(`/kubernetes/dashboard?cluster=${record.name}`);
      })
      .catch((err) => {
        messageApi.error(
          formatMessage({ id: "cluster.switch_failed" }) +
            ": " +
            JSON.stringify(err)
        );
      });
  };

  const columns: TableProps<Cluster>["columns"] = [
    {
      title: formatMessage({ id: "cluster.name" }),
      dataIndex: "name",
      key: "name",
      align: "center",
      render: (text, record) =>
        record.status ? (
          <a onClick={() => redirect(record)}>{text}</a>
        ) : (
          <span style={{ color: "#aaa", cursor: "not-allowed" }}>{text}</span>
        ),
    },
    {
      title: formatMessage({ id: "cluster.status" }),
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (_, record) => {
        if (record.status) {
          return (
            <Tag color="green">{formatMessage({ id: "cluster.online" })}</Tag>
          );
        } else {
          return (
            <Tag color="red">{formatMessage({ id: "cluster.offline" })}</Tag>
          );
        }
      },
    },
    {
      title: formatMessage({ id: "cluster.version" }),
      dataIndex: "version",
      key: "version",
      align: "center",
    },
    {
      title: formatMessage({ id: "cluster.platform" }),
      dataIndex: "platform",
      key: "platform",
      align: "center",
    },
    {
      title: formatMessage({ id: "cluster.url" }),
      dataIndex: "url",
      key: "url",
      align: "center",
    },
  ];

  const [clusters, setClusters] = useState<Array<Cluster>>([]);

  const fetchClusters = async (): Promise<void> => {
    setLoading(true);
    try {
      const clusters = await invoke("list_clusters");
      setClusters(clusters as Array<Cluster>);
    } catch (error) {
      messageApi.error(
        formatMessage({ id: "cluster.get_clusters_failed" }) +
          ": " +
          JSON.stringify(error)
      );
    } finally {
      setLoading(false);
    }
  };
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    fetchClusters();
  }, []);

  return (
    <div style={{ background: colorBgContainer }}>
      {contextHolder}
      <div data-tauri-drag-region className="container">
        <img
          data-tauri-drag-region
          style={{
            maxHeight: 100,
            maxWidth: 100,
            userSelect: "none",
          }}
          src="/app-icon.png"
          alt=""
        />
        <div>
          <Title data-tauri-drag-region level={1}>
            Kubernetes Manager
          </Title>
        </div>
        <div>
          <Table
            rowKey={(record) => record.name}
            columns={columns}
            dataSource={clusters}
            style={{ width: "50vw", marginTop: "25px" }}
            pagination={false}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
