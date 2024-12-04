import { message, Table, TableProps } from "antd";
import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { Cluster } from "@/types/cluster";
import { useAppDispatch } from "@/store/hook";
import { setActiveCluster } from "@/store/modules/kubernetes";
import TopBar from "@/components/TopBar";
import { Typography } from "antd";

const { Title } = Typography;
import "./index.scss";
import WindowOperation from "@/components/WindowOperation";

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

  useEffect(() => {
    fetchClusters();
  }, []);

  return (
    <>
      <WindowOperation
        hide={false}
        height={40}
        style={{ right: 10 }}
        isMaximize={true}
      />
      <TopBar
        props={{
          minimizable: true,
          maximizable: true,
          closable: true,
          zIndex: 100,
          beforeClose: () => {
            console.log("beforeClose");
            return true;
          },
        }}
      />
      {contextHolder}
      <div className="container">
        <Title level={1}>Kubernetes 列表</Title>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Table
            rowKey={(record) => record.name}
            columns={columns}
            dataSource={clusters}
            style={{ width: "70%" }}
            pagination={false}
          />
        </div>
      </div>
    </>
  );
};
