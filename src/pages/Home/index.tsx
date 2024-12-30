import { message, Table, TableProps, theme } from "antd";
import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { Cluster } from "@/types/cluster";
import { useAppDispatch } from "@/store/hook";
import { setActiveCluster } from "@/store/modules/kubernetes";
import { Typography } from "antd";
import "./index.scss";
import TopBar from "@/components/TopBar";

const { Title } = Typography;

export const Home: FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const redirect = async (record: Cluster) => {
    await invoke("switch_cluster", { clusterName: record.name })
      .then(() => {
        dispatch(setActiveCluster(record.name));
        navigate(`/kubernetes?cluster=${record.name}`);
      })
      .catch((err) => {
        messageApi.error("切换集群失败: " + JSON.stringify(err));
      });
  };

  const columns: TableProps<Cluster>["columns"] = [
    {
      title: "集群名称",
      dataIndex: "name",
      key: "name",
      align: "center",
      render: (text, record) => <a onClick={() => redirect(record)}>{text}</a>,
    },
    {
      title: "集群地址",
      dataIndex: ["cluster", "server"],
      key: "server",
      align: "center",
    },
  ];

  const [clusters, setClusters] = useState<Array<Cluster>>([]);

  /**
   * @description: fetch clusters list from invoke("list_clusters"), and then update state.clusters
   * @return {Promise<void>}
   */
  const fetchClusters = async (): Promise<void> => {
    try {
      const clusters = await invoke("list_clusters");
      setClusters(clusters as Array<Cluster>);
    } catch (error) {
      messageApi.error("获取集群列表失败: " + JSON.stringify(error));
    }
  };
  const {
    token: { colorBgContainer, borderRadiusLG },
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
          src="/ksmlog.png"
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
          />
        </div>
      </div>
    </div>
  );
};
