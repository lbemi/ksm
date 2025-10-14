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
import { Ingress } from "kubernetes-models/networking.k8s.io/v1";
import getAge from "@/utils/k8s/date";
import CustomContent from "@/components/CustomContent";

const IngressPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [ingresses, setIngresses] = useState<Array<Ingress>>([]);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const { Paragraph } = Typography;

  const columns: TableProps<Ingress>["columns"] = [
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
      title: "规则",
      dataIndex: "spec",
      key: "rules",
      render: (spec) => (
        <div>
          {spec?.rules?.map((rule: any, index: any) => (
            <div key={index}>
              {rule.host} -{" "}
              {rule.http?.paths.map((path: any) => path.path).join(", ")}
            </div>
          ))}
        </div>
      ),
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
      render: (_, record: Ingress) => (
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
                  onClick: () => handleDeleteIngress(record),
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

  const handleDeleteIngress = (ingress: Ingress) => {
    Modal.confirm({
      title: "确认删除",
      content: (
        <span>
          您确定要删除 Ingress{" "}
          <span style={{ color: "red" }}>{ingress.metadata?.name}</span> 吗？
        </span>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await kubernetes_request(
            "DELETE",
            `/apis/networking.k8s.io/v1/namespaces/${ingress.metadata?.namespace}/ingresses/${ingress.metadata?.name}`
          );
          message.success(`Ingress ${ingress.metadata?.name} 删除成功`);
          list_ingresses();
        } catch (error) {
          message.error(`删除失败: ${error}`);
        }
      },
    });
  };

  const list_ingresses = () => {
    setLoading(true);
    let url: string;
    if (namespace === "all") {
      url = "/apis/networking.k8s.io/v1/ingresses";
    } else {
      url = `/apis/networking.k8s.io/v1/namespaces/${namespace}/ingresses`;
    }
    kubernetes_request<Array<Ingress>>("GET", url)
      .then((res) => {
        setIngresses(res);
      })
      .catch((err) => {
        console.log("err: ", err);
      });
    setLoading(false);
  };

  useEffect(() => {
    list_ingresses();
  }, [namespace]);

  const filteredIngresses = (searchText: string) => {
    if (searchText === "" || typeof searchText !== "string") return ingresses;
    const filterText = searchText.toLowerCase();
    return ingresses.filter((ingress: Ingress) =>
      ingress.metadata!.name!.toLowerCase().includes(filterText)
    );
  };

  return (
    <>
      <CustomContent
        loading={loading}
        columns={columns}
        refresh={list_ingresses}
        filter={filteredIngresses}
      />
    </>
  );
};

export default IngressPage;
