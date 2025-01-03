import { useAppSelector } from "@/store/hook";
import {
  Button,
  Checkbox,
  GetProps,
  Input,
  Popover,
  Table,
  TableProps,
  Tag,
  Tooltip,
  Dropdown,
  Modal,
  message,
} from "antd";
import { Pod, IContainer, IPodStatus } from "kubernetes-models/v1";
import { FC, useEffect, useState } from "react";
import {
  SyncOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { CheckboxOptionType } from "antd/es/checkbox/Group";
import type { CheckboxProps } from "antd";
import "./index.scss";
import { Typography } from "antd";
import { IContainerStatus } from "kubernetes-models/v1/ContainerStatus";
import { IIoK8sApiCoreV1PodCondition } from "kubernetes-models/v1/PodCondition";
import { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from "@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta";
import getAge from "@/utils/k8s/date";
import { kubernetes_request } from "@/api/cluster";

const PodPage: FC = () => {
  const columns: TableProps<Pod>["columns"] = [
    {
      title: "名称",
      dataIndex: ["metadata", "name"],
      key: "name",
      width: 220,
      fixed: "left",
      render: (text) => (
        <div className="pod-name-cell">
          <Paragraph
            copyable={{
              text: text,
              tooltips: ["复制名称", "已复制"],
            }}
            style={{ marginRight: 8, marginBottom: 0 }}
          />
          <span className="pod-name-text" title={text}>
            {text}
          </span>
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: ["status"],
      key: "status",
      width: 120,
      render: (status, record) => (
        <div>{formatterPodStatus(status, record)}</div>
      ),
    },
    {
      title: "镜像",
      dataIndex: ["spec", "containers"],
      key: "image",
      width: 100,
      align: "center",
      onCell: () => {
        return {
          style: {
            maxWidth: 180,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            cursor: "pointer",
          },
        };
      },
      render: (containers) => <div>{get_images(containers)}</div>,
    },
    {
      title: "容器IP",
      dataIndex: ["status", "podIP"],
      key: "ip",
      render: (text) => <div>{text}</div>,
    },
    {
      title: "所在节点",
      dataIndex: ["status", "hostIP"],
      key: "hostIP",
      render: (hostIP) => <div>{hostIP}</div>,
    },
    {
      title: "Age",
      dataIndex: "metadata",
      key: "creationTimestamp",
      render: (metadata: IIoK8sApimachineryPkgApisMetaV1ObjectMeta) => {
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
      render: (_, record: Pod) => (
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
                  onClick: () => handleDeletePod(record),
                },
                { type: "divider" },
                { key: "terminal", label: "终端", icon: <SettingOutlined /> },
                { key: "logs", label: "日志", icon: <SettingOutlined /> },
                { key: "files", label: "文件", icon: <SettingOutlined /> },
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

  const [loading, setLoading] = useState(false);
  const [pods, setPods] = useState<Array<Pod>>([]);
  const [showColumn, setShowColumn] = useState(columns);
  const clusterName = useAppSelector((state) => state.kubernetes.activeCluster);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const plainOptions = columns!
    .filter((column) => column.key !== "action")
    .map(({ key, title }) => ({
      label: title,
      value: key,
    }));
  const [open, setOpen] = useState(false);
  const handleOpen = (open: boolean) => {
    setOpen(open);
  };
  const defaultCheckedList = columns
    .filter((column) => column.key !== "action")
    .map(({ key }) => key)
    .filter((key): key is string => key !== undefined);
  const [checkedList, setCheckedList] = useState<string[]>(defaultCheckedList);
  const checkAll = plainOptions.length === checkedList.length;
  const indeterminate =
    checkedList.length > 0 && checkedList.length < plainOptions.length;

  const { Paragraph } = Typography;
  const CheckboxGroup = Checkbox.Group;
  const TABLE_SCROLL_HEIGHT = "calc(100vh - 320px)";
  const SEARCH_WIDTH = 300;

  const formatterPodStatus = (status: IPodStatus, pod: Pod) => {
    if (pod.metadata && pod.metadata.deletionTimestamp) {
      return (
        <div>
          <SyncOutlined color="#c62828" spin /> "Terminating"
        </div>
      );
    }
    let phase = status.phase;
    switch (phase) {
      case "Failed":
        if (status.reason) {
          return formatterIcon("#c62828", status.reason || "");
        }
        return formatterIcon(
          "#c62828",
          getContainerStatuses(status, false) || ""
        );
      case "Pending":
        return formatterIcon(
          "#f3d362",
          getContainerStatuses(status, true) || ""
        );
      case "Succeeded":
        return formatterIcon(
          "#155ec0",
          getContainerStatuses(status, false) || ""
        );
      case "Running":
        if (
          status.conditions &&
          status.conditions.filter(
            (s: IIoK8sApiCoreV1PodCondition) => s.status !== "True"
          ).length > 0
        ) {
          return formatterIcon(
            "#c62828",
            getContainerStatuses(status, true) || ""
          );
        }
        return formatterIcon("#2ba552", phase || "");
      default:
        return formatterIcon("#c62828", phase || "");
    }
  };
  const getContainerStatuses = (data: IPodStatus, pending: boolean) => {
    let containers = [
      ...(data.initContainerStatuses || []),
      ...(data.containerStatuses || []),
    ];
    containers = containers.filter((s) => !s.ready);
    const waiting = containers.find((s) => s.state!.waiting);
    const terminated = containers.find((s) => s.state!.terminated);

    if (pending) {
      const init = (data.initContainerStatuses || []).filter(
        (s: IContainerStatus) => s.ready
      ).length;
      if (init === (data.initContainerStatuses || []).length) {
        return containers.length === 0
          ? "Pending"
          : waiting
          ? waiting.state!.waiting!.reason
          : terminated
          ? terminated.state!.terminated!.reason
          : "Pending";
      }
      return `Init:${init}/${
        data.initContainerStatuses ? data.initContainerStatuses.length : 0
      }`;
    }

    return containers.length === 0
      ? "unknown"
      : waiting
      ? waiting.state!.waiting!.reason
      : terminated
      ? terminated.state!.terminated!.reason
      : "unknown";
  };
  const formatterIcon = (color: string, text: string) => {
    return (
      <>
        <Tag
          icon={
            <SyncOutlined
              spin={text === "Running" || text === "ContainerCreating"}
            />
          }
          color={color}
        >
          {text}
        </Tag>
      </>
    );
  };
  const get_images = (containers: Array<IContainer>) => {
    if (!containers.length) return null;

    const firstImage = containers[0];
    const remainingImages = containers.slice(1);

    return (
      <div
        className="pod-images"
        style={{ display: "flex", justifyContent: "center" }}
      >
        <Tooltip
          placement="topLeft"
          title={
            <div className="image-tooltip">
              <Tag color="geekblue" className="copyable-tag">
                <Typography.Text copyable={{ text: firstImage.image }}>
                  {firstImage.image}
                </Typography.Text>
              </Tag>
              {remainingImages.length > 0 &&
                remainingImages.map((container, index) => (
                  <Tag color="geekblue" key={index} className="copyable-tag">
                    <Typography.Text copyable={{ text: container.image }}>
                      {container.image}
                    </Typography.Text>
                  </Tag>
                ))}
            </div>
          }
        >
          <Tag color="geekblue">
            <Typography.Text copyable={{ text: firstImage.image }}>
              {firstImage.image}
            </Typography.Text>
            {remainingImages.length > 0 && ` +${remainingImages.length}`}
          </Tag>
        </Tooltip>
      </div>
    );
  };
  const handleDeletePod = (pod: Pod) => {
    Modal.confirm({
      title: "确认删除",
      content: (
        <span>
          您确定要删除 Pod{" "}
          <span style={{ color: "red" }}>{pod.metadata?.name}</span> 吗？
        </span>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await kubernetes_request(
            "DELETE",
            `/api/v1/namespaces/${pod.metadata?.namespace}/pods/${pod.metadata?.name}`
          );
          message.success(`Pod ${pod.metadata?.name} 删除成功`);
          list_pods(namespace);
        } catch (error) {
          message.error(`删除失败: ${error}`);
        }
      },
    });
  };
  const onChange = (list: string[]) => {
    setCheckedList(list);
  };
  /**
   * When the "全选" checkbox is changed, this function is called.
   * If the checkbox is checked, then all the column names are added to the `checkedList`.
   * If the checkbox is unchecked, then the `checkedList` is cleared.
   * The `checkedList` is a state that keeps track of the selected column names.
   * @param e The change event of the checkbox.
      
   */
  const onCheckAllChange: CheckboxProps["onChange"] = (e) => {
    const checkboxValues = e.target.checked
      ? plainOptions.map((option) => option.value)
      : [];
    setCheckedList(checkboxValues as string[]);
  };

  /**
   * Returns a JSX element with a set of checkboxes for selecting columns
   * to display in the table, and a button to confirm the selection.
   * The checkboxes are grouped by their corresponding column titles.
   * The button is labeled " " and is of type primary.
   * Clicking the button will trigger the `handelSelectOption` function.
   * The component also includes a cancel button labeled " " that
   * will close the popover when clicked.
   *
   * The checkboxes are based on the `plainOptions` array, which is
   * generated from the `columns` array.
   *
   * The component is wrapped in a popover with a trigger of type
   * "click", and the popover is displayed when the user clicks on
   * the " " button.
   */
  const rowSelection = () => {
    return (
      <>
        <div>
          <CheckboxGroup
            options={plainOptions as CheckboxOptionType[]}
            value={checkedList}
            onChange={onChange}
          />
        </div>
        <Checkbox
          indeterminate={indeterminate}
          onChange={onCheckAllChange}
          checked={checkAll}
        >
          全选
        </Checkbox>
        <div className="select-option">
          <Button
            className="mr10"
            type="primary"
            size="small"
            onClick={handelSelectOption}
          >
            确定
          </Button>
          <Button
            className="ml10"
            size="small"
            onClick={() => handleOpen(false)}
          >
            取消
          </Button>
        </div>
      </>
    );
  };

  const list_pods = async (namespace: string) => {
    setLoading(true);
    let url = "";
    if (namespace === "all") {
      url = "/api/v1/pods";
    } else {
      url = "/api/v1/namespaces/" + namespace + "/pods";
    }
    kubernetes_request<Array<Pod>>("GET", url)
      .then((res) => {
        setPods(res);
      })
      .catch((err) => {
        console.log("err: ", err);
      });
    setLoading(false);
  };

  useEffect(() => {
    if (!clusterName) return;
    list_pods(namespace);
    handelSelectOption();
  }, [namespace]);

  const handelSelectOption = () => {
    const newColumns = columns!.map((item) => ({
      ...item,
      hidden:
        item.key === "action"
          ? false
          : !checkedList.includes(item.key as string),
    }));

    setShowColumn(newColumns);
    setOpen(false);
  };

  type SearchProps = GetProps<typeof Input.Search>;
  const { Search } = Input;
  const [searchText, setSearchText] = useState("");

  const getFilteredPods = () => {
    if (!searchText) return pods;

    return pods.filter((pod) => {
      const name = pod.metadata?.name?.toLowerCase() || "";
      const status = pod.status?.phase?.toLowerCase() || "";
      const ip = pod.status?.podIP?.toLowerCase() || "";
      const node = pod.status?.hostIP?.toLowerCase() || "";
      const searchLower = searchText.toLowerCase();

      return (
        name.includes(searchLower) ||
        status.includes(searchLower) ||
        ip.includes(searchLower) ||
        node.includes(searchLower)
      );
    });
  };

  const onSearch: SearchProps["onSearch"] = (value) => {
    setSearchText(value);
  };

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  return (
    <div className="pod-page">
      <div className="page-header">
        <div className="left-section">
          <Button type="primary" icon={<PlusOutlined />}>
            新增 Pod
          </Button>
          <Search
            allowClear
            placeholder="搜索 Pod 名称、状态、IP、节点..."
            onSearch={onSearch}
            onChange={onSearchChange}
            value={searchText}
            style={{ width: SEARCH_WIDTH }}
          />
        </div>
        <div className="right-section">
          <Button
            icon={<SyncOutlined />}
            onClick={() => list_pods(namespace)}
            className="refresh-button"
          >
            刷新
          </Button>
          <Popover
            trigger="click"
            placement="bottomRight"
            content={rowSelection()}
            open={open}
            onOpenChange={handleOpen}
          >
            <Button icon={<SettingOutlined />}>自定义列</Button>
          </Popover>
        </div>
      </div>

      <Table
        className="pod-table"
        columns={showColumn}
        dataSource={getFilteredPods()}
        loading={loading}
        rowKey={(record) => record.metadata!.name!}
        scroll={{ x: "max-content", y: TABLE_SCROLL_HEIGHT }}
        pagination={{
          showTotal: (total) => `共 ${total} 条`,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
    </div>
  );
};

export default PodPage;
