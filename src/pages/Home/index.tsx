import { message, Table, TableProps } from "antd";
import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { Cluster } from "@/types/cluster";
import { useAppDispatch } from "@/store/hook";
import { setActiveCluster } from "@/store/modules/kubernetes";

export const Home: FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const redircet = async (record: Cluster) => {
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
      render: (text, record) => <a onClick={() => redircet(record)}>{text}</a>,
    },
    {
      title: "集群地址",
      dataIndex: ["cluster", "server"],
      key: "server",
      align: "center",
    },
  ];

  const [clusters, setClusters] = useState<Array<Cluster>>([]);

  const list_cluster = async () => {
    await invoke("list_clusters").then((res) => {
      setClusters(res as Array<Cluster>);
    });
  };
  useEffect(() => {
    list_cluster();
  }, []);

  return (
    <>
      {contextHolder}
      <div className="container">
        <h1>Kuberntes 列表</h1>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Table
            rowKey={(record) => record.name}
            columns={columns}
            dataSource={clusters}
            style={{ width: "80%" }}
            pagination={false}
          />
        </div>
      </div>
    </>
  );
};
