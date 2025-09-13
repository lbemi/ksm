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
import { Service } from "kubernetes-models/v1";
import getAge from "@/utils/k8s/date";
import CustomContent from "@/components/CustomContent";

const ServicePage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Array<Service>>([]);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const { Paragraph } = Typography;

  const columns: TableProps<Service>["columns"] = [
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
      title: "类型",
      dataIndex: ["spec", "type"],
      key: "type",
      render: (text) => <div>{text}</div>,
    },
    {
      title: "Cluster IP",
      dataIndex: ["spec", "clusterIP"],
      key: "clusterIP",
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
      render: (_, record: Service) => (
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
                  onClick: () => handleDeleteService(record),
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

  const handleDeleteService = (service: Service) => {
    Modal.confirm({
      title: "确认删除",
      content: (
        <span>
          您确定要删除 Service{" "}
          <span style={{ color: "red" }}>{service.metadata?.name}</span> 吗？
        </span>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await kubernetes_request(
            "DELETE",
            `/api/v1/namespaces/${service.metadata?.namespace}/services/${service.metadata?.name}`
          );
          message.success(`Service ${service.metadata?.name} 删除成功`);
          list_services();
        } catch (error) {
          message.error(`删除失败: ${error}`);
        }
      },
    });
  };

  const list_services = () => {
    setLoading(true);
    let url: string;
    if (namespace === "all") {
      url = "/api/v1/services";
    } else {
      url = `/api/v1/namespaces/${namespace}/services`;
    }
    kubernetes_request<Array<Service>>("GET", url)
      .then((res) => {
        setServices(res);
      })
      .catch((err) => {
        console.log("err: ", err);
      });
    setLoading(false);
  };

  useEffect(() => {
    list_services();
  }, [namespace]);

  const filteredServices = (searchText: string) => {
    if (searchText === "" || typeof searchText !== "string") return services;
    const filterText = searchText.toLowerCase();
    return services.filter((service: Service) =>
      service.metadata!.name!.toLowerCase().includes(filterText)
    );
  };
  return (
    <>
      <CustomContent
        loading={loading}
        columns={columns}
        refresh={list_services}
        filter={filteredServices}
      />
    </>
  );
};

export default ServicePage;
