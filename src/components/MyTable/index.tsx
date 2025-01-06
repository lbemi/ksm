import {
  Button,
  CheckboxOptionType,
  CheckboxProps,
  GetProps,
  Input,
  Popover,
  Splitter,
  Table,
} from "antd";
import {
  SyncOutlined,
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { FC, useEffect, useState } from "react";
import { Checkbox, TableProps } from "antd";
import { useAppSelector } from "@/store/hook";
import "./index.scss";

export interface MyTableProps<T> {
  columns: TableProps<T>["columns"];
  refresh: () => void;
  del: () => void;
  filter: (data: T) => Array<T>;
  loading: boolean;
}

const MyTable: FC<MyTableProps<any>> = ({
  columns,
  refresh,
  del,
  filter,
  loading,
}) => {
  const [showColumn, setShowColumn] = useState(columns);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const [searchText, setSearchText] = useState<string>("");

  useEffect(() => {
    handelSelectOption();
  }, [namespace]);

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
      <div className={"my-table"}>
        <div className={"table-header"}>
          <div className="left-section">
            <Button color="primary" variant="outlined" icon={<PlusOutlined />}>
              新增
            </Button>
            <Button
              danger
              disabled={!hasSelected}
              loading={deleteLoading}
              icon={<DeleteOutlined />}
              onClick={() => {
                setDeleteLoading(true);
                del();
                setDeleteLoading(false);
              }}
            >
              删除
            </Button>
            <Search
              allowClear
              placeholder="搜索 Pod 名称、状态、IP、节点..."
              onSearch={onSearch}
              onChange={onSearchChange}
              value={searchText}
              style={{ width: 300 }}
              onClick={filter}
            />
          </div>
          <div className="right-section">
            <Button
              icon={<SyncOutlined />}
              type="dashed"
              onClick={refresh}
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
              <Button type="dashed" icon={<SettingOutlined />}>
                自定义列
              </Button>
            </Popover>
          </div>
        </div>
        <Table
          rowSelection={tableRowSelection}
          className="table"
          columns={showColumn}
          dataSource={filter(searchText)}
          loading={loading}
          rowKey={(record) => record.metadata!.uid!}
          scroll={{ x: "max-content", y: "calc(100vh - 300px)" }}
          pagination={false}
        />
      </div>
    </>
  );
};

export default MyTable;
