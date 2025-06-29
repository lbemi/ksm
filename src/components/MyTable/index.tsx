import {
  Button,
  CheckboxOptionType,
  CheckboxProps,
  GetProps,
  Input,
  Popover,
  Select,
  Table,
  Typography,
} from "antd";
import {
  SyncOutlined,
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { FC, useEffect, useState } from "react";
import { Checkbox, TableProps } from "antd";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import "./index.scss";
import { apiClient, AppsV1Url, kubernetes_request } from "@/api/cluster";
import { setActiveNamespace } from "@/store/modules/kubernetes";
import { Namespace } from "kubernetes-types/core/v1";

export interface MyTableProps<T> {
  columns: TableProps<T>["columns"];
  refresh: () => void;
  del?: () => void;
  filter: (data: T) => Array<T>;
  scroll?: TableProps<T>["scroll"];
  loading: boolean;
  total?: number;
  disableNamespace?: boolean;
}

const MyTable: FC<MyTableProps<any>> = ({
  columns,
  refresh,
  del,
  filter,
  loading,
  scroll,
  total,
  disableNamespace,
}) => {
  const [showColumn, setShowColumn] = useState(columns);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const [searchText, setSearchText] = useState<string>("");
  const dispatch = useAppDispatch();

  useEffect(() => {
    handelSelectOption();
  }, [namespace]);
  const { Title } = Typography;
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

  const defaultCheckedList = columns!
    .filter((column) => column.key !== "action")
    .map(({ key }) => key)
    .filter((key): key is string => key !== undefined);

  const [checkedList, setCheckedList] = useState<string[]>(defaultCheckedList);
  const checkAll = plainOptions.length === checkedList.length;
  const indeterminate =
    checkedList.length > 0 && checkedList.length < plainOptions.length;
  type SearchProps = GetProps<typeof Input.Search>;
  const { Search } = Input;

  const CheckboxGroup = Checkbox.Group;

  const onSearch: SearchProps["onSearch"] = (value) => {
    setSearchText(value);
  };

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === undefined || typeof e.target.value !== "string") {
      return;
    }
    setSearchText(e.target.value);
  };
  const onChange = (list: string[]) => {
    setCheckedList(list);
  };

  const onCheckAllChange: CheckboxProps["onChange"] = (e) => {
    const checkboxValues = e.target.checked
      ? plainOptions.map((option) => option.value)
      : [];
    setCheckedList(checkboxValues as string[]);
  };
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
  type TableRowSelection<T extends object = object> =
    TableProps<T>["rowSelection"];
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const tableRowSelection: TableRowSelection<any> = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  const hasSelected = selectedRowKeys.length > 0;

  const [namespaces, setNamespaces] = useState<Array<Namespace>>([]);
  const list_namespaces = async () => {
    await apiClient.get<Namespace>(AppsV1Url, "namespaces").then((res) => {
      setNamespaces(res);
    });
  };

  useEffect(() => {
    list_namespaces();
  }, []);

  const rowSelection = () => {
    return (
      <div className="pod-page">
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
      </div>
    );
  };

  return (
    <>
      <div id="my-table" className={"my-table"}>
        <div className={"table-header"}>
          <div className="left-section">
            <Button
              color="primary"
              variant="outlined"
              size="small"
              icon={<PlusOutlined />}
            >
              新增
            </Button>
            <Button
              danger
              size="small"
              disabled={!hasSelected}
              loading={deleteLoading}
              icon={<DeleteOutlined />}
              onClick={() => {
                setDeleteLoading(true);
                del?.();
                setDeleteLoading(false);
              }}
            >
              删除
            </Button>
            {!disableNamespace && (
              <Select
                style={{ width: 180 }}
                defaultValue={namespace}
                size="small"
                options={[
                  { value: "all", label: "全部命名空间" },
                  ...namespaces.map((namespace) => ({
                    value: namespace.metadata!.name,
                    label: <span>{namespace.metadata!.name}</span>,
                  })),
                ]}
                dropdownStyle={{ width: "250px" }}
                onChange={(value) => {
                  dispatch(setActiveNamespace(value));
                }}
              />
            )}
            <Search
              allowClear
              size="small"
              placeholder="搜索 Pod 名称、状态、IP、节点..."
              onSearch={onSearch}
              onChange={onSearchChange}
              value={searchText}
              style={{ width: 200 }}
              onClick={filter}
            />
            <div className="total-count">
              <Title level={5} style={{ margin: 0 }}>
                总计:{filter(searchText).length}/{total || 0}
              </Title>
            </div>
          </div>
          <div className="right-section">
            <Button
              icon={<SyncOutlined />}
              type="dashed"
              onClick={refresh}
              className="refresh-button"
              size="small"
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
              <Button type="dashed" icon={<SettingOutlined />} size="small">
                自定义列
              </Button>
            </Popover>
          </div>
        </div>
        <div>
          <Table
            rowSelection={tableRowSelection}
            className="table"
            columns={showColumn}
            dataSource={filter(searchText)}
            loading={loading}
            rowKey={(record) => record.metadata!.uid!}
            scroll={scroll}
            pagination={false}
          />
        </div>
      </div>
    </>
  );
};

export default MyTable;
