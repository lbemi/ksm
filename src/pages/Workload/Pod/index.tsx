import { useAppSelector } from "@/store/hook";
import { invoke } from "@tauri-apps/api/core";
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
} from "antd";
import { Pod, IContainer, IPodStatus } from "kubernetes-models/v1";
import { FC, useEffect, useState } from "react";
import { PicRightOutlined, SyncOutlined } from "@ant-design/icons";
import { CheckboxOptionType } from "antd/es/checkbox/Group";
import type { CheckboxProps } from "antd";
import "./index.scss";
import dayjs from "dayjs";
import { Typography } from "antd";
const { Paragraph } = Typography;

const CheckboxGroup = Checkbox.Group;

const columns: TableProps<Pod>["columns"] = [
  {
    title: "名称",
    dataIndex: ["metadata", "name"],
    key: "name",
    width: 220,
    fixed: "left",
    render: (text) => (
      <div>
        <a
          onClick={() => {
            console.log(text);
          }}
        >
          <Paragraph
            copyable={{
              text: text,
            }}
          >
            {text}
          </Paragraph>
        </a>
      </div>
    ),
  },
  {
    title: "状态",
    dataIndex: ["status"],
    key: "status",
    width: 120,
    render: (status, record) => <div>{formatterPodStatus(status, record)}</div>,
  },
  {
    title: "镜像",
    dataIndex: ["spec", "containers"],
    key: "image",
    width: 100,
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
    title: "创建时间",
    dataIndex: ["metadata", "creationTimestamp"],
    key: "create_time",
    defaultSortOrder: "descend",
    sorter: (a, b) =>
      dayjs(a.metadata?.creationTimestamp).valueOf() -
      dayjs(b.metadata?.creationTimestamp).valueOf(),
    render: (text) => <div>{dayjs(text).format("YYYY-MM-DD HH:mm:ss")}</div>,
  },
  {
    title: "操作",
    key: "action",
    fixed: "right",
    dataIndex: "action",
    width: 170,
    render: () => (
      <div>
        <Button type="link" size="small">
          详情
        </Button>
        <Button type="link" size="small">
          编辑
        </Button>
        <Button color="danger" variant="link" size="small">
          删除
        </Button>
        <Button type="link" size="small">
          终端
        </Button>
        <Button type="link" size="small">
          日志
        </Button>
        <Button type="link" size="small">
          文件
        </Button>
      </div>
    ),
  },
];

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
      return formatterIcon("#f3d362", getContainerStatuses(status, true) || "");
    case "Succeeded":
      return formatterIcon(
        "#155ec0",
        getContainerStatuses(status, false) || ""
      );
    case "Running":
      if (
        status.conditions &&
        status.conditions.filter((s) => s.status !== "True").length > 0
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
      (s) => s.ready
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
  return (
    <div className="pod-images">
      {containers.map((container, index) => (
        <div key={index}>
          <Tooltip placement="topLeft" title={container.image}>
            <Tag key={index} color="geekblue">
              {container.image}
            </Tag>
          </Tooltip>
        </div>
      ))}
    </div>
  );
};

const PodPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const clusterName = useAppSelector((state) => state.kubernetes.activeCluster);
  const [pods, setPods] = useState<Array<Pod>>([]);
  const [showColumn, setShowColumn] = useState(columns);
  const plainOptions = columns!.map(({ key, title }) => ({
    label: title,
    value: key,
  }));
  const [open, setOpen] = useState(false);
  const handleOpen = (open: boolean) => {
    setOpen(open);
  };
  const defaultCheckedList = columns
    .map(({ key }) => key)
    .filter((key): key is string => key !== undefined);
  const [checkedList, setCheckedList] = useState<string[]>(defaultCheckedList);
  const checkAll = plainOptions.length === checkedList.length;
  const indeterminate =
    checkedList.length > 0 && checkedList.length < plainOptions.length;

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
  // const list_pods = async (clusterName: string, namespace: string) => {
  //   setLoading(true);
  //   await invoke("list_pods", {
  //     clusterName: clusterName,
  //     namespace: namespace,
  //   })
  //     .then((res) => {
  //       setPods(res as Array<Pod>);
  //     })
  //     .catch((err) => {
  //       console.log("err: ", err);
  //     });
  //   setLoading(false);
  // };
  const list_pods = async (namespace: string) => {
    setLoading(true);
    await invoke("kubernetes_api", {
      resource: "pods",
      verb: "GET",
      namespace: namespace,
    })
      .then((res) => {
        setPods(res as Array<Pod>);
      })
      .catch((err) => {
        console.log("err: ", err);
      });
    setLoading(false);
  };
  useEffect(() => {
    if (!clusterName) return;
    list_pods("default");
    handelSelectOption();
  }, [clusterName]);

  const handelSelectOption = () => {
    const newColumns = columns!.map((item) => ({
      ...item,
      hidden: !checkedList.includes(item.key as string),
    }));

    setShowColumn(newColumns);
    setOpen(false);
  };

  type SearchProps = GetProps<typeof Input.Search>;
  const { Search } = Input;
  const onSearch: SearchProps["onSearch"] = (value, _e, info) =>
    console.log(info?.source, value);

  return (
    <>
      <div className="div-header">
        <div>
          <Button type="primary">新增</Button>
          <Search
            placeholder="input search text"
            onSearch={onSearch}
            style={{ width: 200, marginLeft: 20 }}
          />
        </div>
        <div>
          <Button
            icon={<PicRightOutlined />}
            type="dashed"
            style={{ marginRight: 20 }}
            onClick={() => list_pods("default")}
          >
            刷新
          </Button>
          <Popover
            trigger={"click"}
            placement="bottom"
            content={() => rowSelection()}
            open={open}
            onOpenChange={handleOpen}
          >
            <Button icon={<PicRightOutlined />} type="dashed">
              自定义列
            </Button>
          </Popover>
        </div>
      </div>
      <Table
        className="table"
        columns={showColumn}
        dataSource={pods}
        loading={loading}
        rowKey={(record) => record.metadata!.name!}
        scroll={{ x: "max-content", y: "calc(100vh - 320px)" }}
        pagination={{ showTotal: (total) => `共 ${total} 条` }}
      />
    </>
  );
};

export default PodPage;
