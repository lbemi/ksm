import {
  Affix,
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
import { kubeApi, AppsV1Url } from "@/api/cluster";
import { setActiveNamespace } from "@/store/modules/kubernetes";
import { Namespace } from "kubernetes-types/core/v1";
import { createStyles } from "antd-style";
import UIcon from "../UIcon";
import { useLocale } from "@/locales";

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

const useStyle = createStyles(({ css }) => {
  return {
    customTable: css`
      .ant-table {
        .ant-table-container {
          .ant-table-body,
          .ant-table-content {
            // scrollbar-width: thin;
            // scrollbar-color: #eaeaea transparent;
            // scrollbar-gutter: stable;
          }
        }
      }
    `,
  };
});
const MyTable: FC<MyTableProps<any>> = ({
  columns,
  refresh,
  del,
  filter,
  loading,
  scroll = { y: "calc(100vh - 140px)" },
  total,
  disableNamespace,
}) => {
  const { styles } = useStyle();
  const [showColumn, setShowColumn] = useState(columns);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const namespace = useAppSelector((state) => state.kubernetes.namespace);
  const [searchText, setSearchText] = useState<string>("");
  const dispatch = useAppDispatch();
  const { formatMessage } = useLocale();

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
    setSelectedRowKeys(newSelectedRowKeys);
  };
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const tableRowSelection: TableRowSelection<any> = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  const hasSelected = selectedRowKeys.length > 0;

  const [namespaces, setNamespaces] = useState<Array<Namespace>>([]);
  const list_namespaces = async () => {
    await kubeApi.get<Namespace>(AppsV1Url, "namespaces").then((res) => {
      setNamespaces(res);
    });
  };

  const scrollToTop = () => {
    const parentDom = document.getElementById("my-table");
    const childDom = parentDom?.querySelector(".ant-table-body");
    childDom?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 检测滚动条是否显示
  const checkScrollbarVisibility = () => {
    const parentDom = document.getElementById("my-table");
    const childDom = parentDom?.querySelector(".ant-table-body") as HTMLElement;
    if (childDom) {
      const hasVerticalScrollbar =
        childDom.scrollHeight > childDom.clientHeight;
      setShowScrollToTop(hasVerticalScrollbar);
    }
  };

  useEffect(() => {
    list_namespaces();
  }, []);

  // 监听表格数据变化和窗口大小变化来检测滚动条
  useEffect(() => {
    checkScrollbarVisibility();
    const handleResize = () => {
      setTimeout(checkScrollbarVisibility, 100); // 延迟检测，确保DOM更新完成
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [filter(searchText)]); // 当数据变化时重新检测

  const rowSelection = () => {
    return (
      <div>
        <div>
          <CheckboxGroup
            options={plainOptions as CheckboxOptionType[]}
            value={checkedList}
            onChange={onChange}
          />
        </div>

        <div>
          <div className="mt-5 gap-2.5 flex justify-end">
            <Checkbox
              className="flex-1"
              indeterminate={indeterminate}
              onChange={onCheckAllChange}
              checked={checkAll}
            >
              {formatMessage({ id: "button.select_all" })}
            </Checkbox>

            <Button type="primary" size="small" onClick={handelSelectOption}>
              {formatMessage({ id: "button.confirm" })}
            </Button>
            <Button size="small" onClick={() => handleOpen(false)}>
              {formatMessage({ id: "button.cancel" })}
            </Button>
          </div>
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
              {formatMessage({ id: "button.add" })}
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
              {formatMessage({ id: "button.delete" })}
            </Button>
            {!disableNamespace && (
              <Select
                style={{ width: 180 }}
                defaultValue={namespace}
                size="small"
                options={[
                  {
                    value: "all",
                    label: formatMessage({ id: "button.all_namespace" }),
                  },
                  ...namespaces.map((namespace) => ({
                    value: namespace.metadata!.name,
                    label: <span>{namespace.metadata!.name}</span>,
                  })),
                ]}
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
                <span style={{ fontSize: 15 }}>
                  {formatMessage({ id: "button.total" })}:
                  {filter(searchText).length}/{total || 0}
                </span>
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
              {formatMessage({ id: "button.refresh" })}
            </Button>
            <Popover
              trigger="click"
              placement="bottomRight"
              content={rowSelection()}
              open={open}
              onOpenChange={handleOpen}
            >
              <Button type="dashed" icon={<SettingOutlined />} size="small">
                {formatMessage({ id: "button.customColumn" })}
              </Button>
            </Popover>
          </div>
        </div>
        <div>
          <Table
            rowSelection={tableRowSelection}
            className={styles.customTable}
            columns={showColumn}
            dataSource={filter(searchText)}
            loading={loading}
            rowKey={(record) => record.metadata!.uid!}
            scroll={scroll}
            pagination={false}
          />
        </div>
        {showScrollToTop && (
          <Affix
            offsetBottom={50}
            className="affix-bottom"
            style={{ position: "absolute", right: 100 }}
          >
            <UIcon
              type="icon-top1"
              onClick={scrollToTop}
              size={15}
              color="black"
              className="cursor-pointer bg-gray-200 rounded-full p-2 hover:bg-gray-400 opacity-50 hover:opacity-100 transition-all duration-300"
            />
          </Affix>
        )}
      </div>
    </>
  );
};

export default MyTable;
