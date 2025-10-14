import { FC, useEffect, useState, useCallback } from "react";
import {
  Button,
  TableProps,
  Tag,
  Dropdown,
  Modal,
  message,
  Typography,
  Form,
  Input,
  Space,
  Tooltip,
} from "antd";
import { Namespace } from "kubernetes-types/core/v1";
import {
  SyncOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  CheckCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from "@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta";
import getAge from "@/utils/k8s/date";
import {
  list_namespaces,
  delete_namespace,
  create_namespace,
} from "@/api/namespace";
import { useLocale } from "@/locales";
import ViewYaml from "@/components/ViewYaml";
import { useAppDispatch } from "@/store/hook";
import { setActiveNamespace } from "@/store/modules/kubernetes";
import MyTable from "@/components/MyTable";

const { Text } = Typography;

const NamespacePage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [namespaces, setNamespaces] = useState<Array<Namespace>>([]);
  const [yamlVisible, setYamlVisible] = useState(false);
  const [yamlData, setYamlData] = useState<Namespace | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();
  const { formatMessage } = useLocale();
  const dispatch = useAppDispatch();

  const handleShowYaml = useCallback((namespace: Namespace) => {
    setYamlData(namespace);
    setYamlVisible(true);
  }, []);

  const handleSetDefault = useCallback(
    (namespace: Namespace) => {
      const name = namespace.metadata?.name;
      if (name) {
        dispatch(setActiveNamespace(name));
        message.success(formatMessage({ id: "message.success" }));
      }
    },
    [dispatch, formatMessage]
  );

  const handleCreateNamespace = async (values: {
    name: string;
    labels?: string;
    annotations?: string;
  }) => {
    setCreateLoading(true);
    try {
      const namespace: Namespace = {
        apiVersion: "v1",
        kind: "Namespace",
        metadata: {
          name: values.name,
          labels: values.labels ? parseKeyValuePairs(values.labels) : undefined,
          annotations: values.annotations
            ? parseKeyValuePairs(values.annotations)
            : undefined,
        },
      };

      await create_namespace(namespace);
      message.success(formatMessage({ id: "message.success" }));
      setCreateModalVisible(false);
      form.resetFields();
      list_namespaces_data();
    } catch (error) {
      message.error(formatMessage({ id: "message.error" }));
    } finally {
      setCreateLoading(false);
    }
  };

  const parseKeyValuePairs = useCallback(
    (input: string): Record<string, string> => {
      const pairs: Record<string, string> = {};
      if (!input.trim()) return pairs;

      input.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && trimmed.includes("=")) {
          const [key, ...valueParts] = trimmed.split("=");
          pairs[key.trim()] = valueParts.join("=").trim();
        }
      });

      return pairs;
    },
    []
  );

  const handleCancelCreate = useCallback(() => {
    setCreateModalVisible(false);
    form.resetFields();
  }, [form]);

  const formatterNamespaceStatus = useCallback(
    (namespace: Namespace) => {
      if (namespace.metadata && namespace.metadata.deletionTimestamp) {
        return (
          <Tag
            bordered={false}
            icon={<SyncOutlined spin={true} />}
            color="volcano"
          >
            {formatMessage({ id: "namespace.status.terminating" })}
          </Tag>
        );
      }

      return (
        <Tag bordered={false} icon={<CheckCircleOutlined />} color="green">
          {formatMessage({ id: "namespace.status.active" })}
        </Tag>
      );
    },
    [formatMessage]
  );

  const formatLabels = useCallback(
    (labels: Record<string, string> | undefined) => {
      if (!labels || Object.keys(labels).length === 0) {
        return <Text type="secondary">-</Text>;
      }

      const labelEntries = Object.entries(labels).slice(0, 3);
      const remainingCount = Object.keys(labels).length - 1;

      return (
        <div>
          {labelEntries.length > 1 && (
            <Tooltip
              title={Object.entries(labels)
                .map(([key, value]) => `${key}=${value}`)
                .join("\n")}
            >
              <Tag style={{ margin: "1px", fontSize: "12px" }}>
                {labelEntries[0][0]}={labelEntries[0][1]}
              </Tag>
              {remainingCount > 0 && (
                <Tag style={{ margin: "1px", fontSize: "12px" }}>
                  +{remainingCount}
                </Tag>
              )}
            </Tooltip>
          )}
          {labelEntries.length === 1 && (
            <Tag style={{ margin: "1px", fontSize: "12px" }}>
              {labelEntries[0][0]}={labelEntries[0][1]}
            </Tag>
          )}
        </div>
      );
    },
    []
  );

  const columns: TableProps<Namespace>["columns"] = [
    {
      title: formatMessage({ id: "namespace.name" }),
      dataIndex: ["metadata", "name"],
      key: "name",
      render: (text) => <Text ellipsis={{ tooltip: text }}>{text}</Text>,
    },
    {
      title: formatMessage({ id: "namespace.status" }),
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (_, record) => formatterNamespaceStatus(record),
    },
    {
      title: formatMessage({ id: "namespace.age" }),
      dataIndex: "metadata",
      key: "creationTimestamp",
      align: "center",
      minWidth: 100,
      render: (metadata: IIoK8sApimachineryPkgApisMetaV1ObjectMeta) => {
        if (metadata.creationTimestamp) {
          return getAge(metadata.creationTimestamp);
        }
        return "-";
      },
    },
    {
      title: formatMessage({ id: "namespace.labels" }),
      dataIndex: ["metadata", "labels"],
      key: "labels",
      render: (labels) => formatLabels(labels),
    },
    {
      title: formatMessage({ id: "table.action" }),
      key: "action",
      fixed: "right",
      dataIndex: "action",
      render: (_, record: Namespace) => (
        <div className="action-buttons">
          <Dropdown
            menu={{
              items: [
                {
                  key: "yaml",
                  label: formatMessage({ id: "button.yaml" }),
                  icon: <EditOutlined />,
                  onClick: () => handleShowYaml(record),
                },
                {
                  key: "set_default",
                  label: formatMessage({ id: "namespace.action.set_default" }),
                  icon: <SettingOutlined />,
                  onClick: () => handleSetDefault(record),
                },
                { type: "divider" },
                {
                  key: "delete",
                  label: formatMessage({ id: "button.delete" }),
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDelete(record.metadata?.name!),
                },
              ],
            }}
          >
            <Button type="link" size="small">
              {formatMessage({ id: "button.more" })} <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      ),
    },
  ];

  const [messageApi, contextHolderMessage] = message.useMessage();

  const handleDelete = (name: string) => {
    modal.confirm({
      title: formatMessage({ id: "namespace.delete_confirm" }),
      content: (
        <div>
          <p>{formatMessage({ id: "namespace.delete_warning" })}</p>
          <p>
            {formatMessage({ id: "button.confirm_delete" })} Namespace{" "}
            <span style={{ color: "red" }}>{name}</span> ?
          </p>
        </div>
      ),
      okText: formatMessage({ id: "button.confirm" }),
      cancelText: formatMessage({ id: "button.cancel" }),
      okButtonProps: { size: "small" },
      cancelButtonProps: { size: "small" },
      onOk: async () => {
        try {
          await delete_namespace(name);
          messageApi.success(formatMessage({ id: "message.success" }));
          list_namespaces_data();
        } catch (error) {
          messageApi.error(formatMessage({ id: "message.error" }));
        }
      },
    });
  };

  const list_namespaces_data = async (refresh = false) => {
    if (!refresh) {
      setLoading(true);
    }
    try {
      const res = await list_namespaces();
      setNamespaces(res);
    } catch (error) {
      message.error(formatMessage({ id: "message.error" }));
    } finally {
      if (!refresh) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    list_namespaces_data();
  }, []);

  const getFilteredNamespaces = (searchText: string) => {
    if (searchText === "" || typeof searchText !== "string") return namespaces;

    return namespaces.filter((namespace) => {
      const name = namespace.metadata?.name?.toLowerCase() || "";
      const searchLower = searchText.toLowerCase();

      return name.includes(searchLower);
    });
  };

  return (
    <>
      {contextHolderMessage}
      {contextHolder}
      <ViewYaml
        data={yamlData}
        name={yamlData?.metadata?.name || ""}
        visible={yamlVisible}
        handleCancel={() => {
          setYamlVisible(false);
          setYamlData(null);
        }}
      />

      {/* Create Namespace Modal */}
      <Modal
        title={formatMessage({ id: "namespace.create_namespace" })}
        open={createModalVisible}
        onCancel={handleCancelCreate}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateNamespace}
          initialValues={{
            labels: "",
            annotations: "",
          }}
        >
          <Form.Item
            label={formatMessage({ id: "namespace.name" })}
            name="name"
            rules={[
              {
                required: true,
                message:
                  formatMessage({ id: "namespace.name" }) +
                  " " +
                  formatMessage({ id: "button.confirm" }),
              },
              {
                pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                message:
                  "命名空间名称只能包含小写字母、数字和连字符，且必须以字母或数字开头和结尾",
              },
              {
                min: 1,
                max: 63,
                message: "命名空间名称长度必须在1-63个字符之间",
              },
            ]}
          >
            <Input placeholder="请输入命名空间名称" />
          </Form.Item>

          <Form.Item
            label={formatMessage({ id: "namespace.labels" })}
            name="labels"
            tooltip="每行一个标签，格式：key=value"
          >
            <Input.TextArea
              rows={4}
              placeholder="environment=production&#10;team=backend&#10;version=v1.0"
            />
          </Form.Item>

          <Form.Item
            label={formatMessage({ id: "namespace.annotations" })}
            name="annotations"
            tooltip="每行一个注解，格式：key=value"
          >
            <Input.TextArea
              rows={4}
              placeholder="description=Production namespace&#10;contact=team@company.com"
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleCancelCreate}>
                {formatMessage({ id: "button.cancel" })}
              </Button>
              <Button type="primary" htmlType="submit" loading={createLoading}>
                {formatMessage({ id: "button.create" })}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <MyTable
        columns={columns}
        refresh={list_namespaces_data}
        filter={getFilteredNamespaces}
        loading={loading}
        total={namespaces.length}
        disableNamespace
        onCreate={() => setCreateModalVisible(true)}
        del={undefined}
      />
    </>
  );
};

export default NamespacePage;
