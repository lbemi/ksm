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
import { CustomResourceDefinition } from "kubernetes-models/apiextensions.k8s.io/v1";
import getAge from "@/utils/k8s/date";
import CustomContent from "@/components/CustomContent";

const CustomResourceDefinitionsPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [customResourceDefinitions, setCustomResourceDefinitions] = useState<
    Array<CustomResourceDefinition>
  >([]);
  const { Paragraph } = Typography;

  const columns: TableProps<CustomResourceDefinition>["columns"] = [
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
      title: "缩写",
      dataIndex: ["spec", "names"],
      key: "shortNames",
      render: (spec) => <div>{spec?.shortNames?.join(", ") || "无"}</div>,
    },
    {
      title: "类型",
      dataIndex: "spec",
      key: "group",
      render: (spec) => <div>{spec?.group}</div>,
    },
    {
      title: "作用域",
      dataIndex: "spec",
      key: "scope",
      render: (spec) => <div>{spec?.scope}</div>,
    },
    {
      title: "版本",
      dataIndex: "spec",
      key: "versions",
      render: (spec) => (
        <div>{spec?.versions?.map((v: any) => v.name).join(", ")}</div>
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
      render: (_, record: CustomResourceDefinition) => (
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
                  onClick: () => handleDeleteCustomResourceDefinition(record),
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

  const handleDeleteCustomResourceDefinition = (
    crd: CustomResourceDefinition
  ) => {
    Modal.confirm({
      title: "确认删除",
      content: (
        <span>
          您确定要删除 CustomResourceDefinition{" "}
          <span style={{ color: "red" }}>{crd.metadata?.name}</span> 吗？
        </span>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await kubernetes_request(
            "DELETE",
            `/apis/apiextensions.k8s.io/v1/customresourcedefinitions/${crd.metadata?.name}`
          );
          message.success(
            `CustomResourceDefinition ${crd.metadata?.name} 删除成功`
          );
          list_customResourceDefinitions();
        } catch (error) {
          message.error(`删除失败: ${error}`);
        }
      },
    });
  };

  const list_customResourceDefinitions = () => {
    setLoading(true);
    kubernetes_request<Array<CustomResourceDefinition>>(
      "GET",
      "/apis/apiextensions.k8s.io/v1/customresourcedefinitions"
    )
      .then((res) => {
        setCustomResourceDefinitions(res);
      })
      .catch((err) => {
        console.log("err: ", err);
      });
    setLoading(false);
  };

  const filteredData = (searchText: string) => {
    if (searchText === "" || typeof searchText !== "string")
      return customResourceDefinitions;

    return customResourceDefinitions.filter(
      (statefulSet: CustomResourceDefinition) => {
        const name = statefulSet.metadata!.name!.toLowerCase() || "";
        const searchLower = searchText ? searchText.toLowerCase() : "";

        return name.includes(searchLower);
      }
    );
  };
  useEffect(() => {
    list_customResourceDefinitions();
  }, []);

  return (
    <>
      <CustomContent
        loading={loading}
        columns={columns}
        refresh={list_customResourceDefinitions}
        filter={filteredData}
      />
    </>
  );
};

export default CustomResourceDefinitionsPage;
