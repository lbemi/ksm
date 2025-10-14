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
  Checkbox,
  TableProps,
} from "antd";
import {
  SyncOutlined,
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useEffect, useState, useMemo, useCallback, FC } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import "./index.scss";
import { kubeApi, AppsV1Url } from "@/api/cluster";
import { setActiveNamespace } from "@/store/modules/kubernetes";
import { Namespace } from "kubernetes-types/core/v1";
import { createStyles } from "antd-style";
import MyIcon from "../MyIcon";
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
  onCreate?: () => void;
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
  onCreate,
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

  // Memoize plainOptions to prevent unnecessary recalculations
  const plainOptions = useMemo(
    () =>
      (columns || [])
        .filter((column: any) => column && column.key !== "action")
        .map(({ key, title }: any) => ({
          label: title,
          value: key,
        }))
        .filter((opt: any) => opt.value !== undefined && opt.value !== null),
    [columns]
  );
  const [open, setOpen] = useState(false);
  const handleOpen = (open: boolean) => {
    setOpen(open);
  };

  // Memoize defaultCheckedList
  const defaultCheckedList = useMemo(
    () =>
      (columns || [])
        .filter((column: any) => column && column.key !== "action")
        .map(({ key }: any) => key)
        .filter((key: any): key is string => key !== undefined),
    [columns]
  );

  const [checkedList, setCheckedList] = useState<string[]>(defaultCheckedList);
  const checkAll = plainOptions.length === checkedList.length;
  const indeterminate =
    checkedList.length > 0 && checkedList.length < plainOptions.length;
  type SearchProps = GetProps<typeof Input.Search>;
  const { Search } = Input;

  const CheckboxGroup = Checkbox.Group;

  // Memoize callback functions to prevent unnecessary re-renders
  const onSearch: SearchProps["onSearch"] = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  const onSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value === undefined || typeof e.target.value !== "string") {
        return;
      }
      setSearchText(e.target.value);
    },
    []
  );

  const onChange = useCallback((list: string[]) => {
    setCheckedList(list);
  }, []);

  const onCheckAllChange: CheckboxProps["onChange"] = useCallback(
    (e: any) => {
      const checkboxValues = e.target.checked
        ? plainOptions.map((option) => option.value)
        : [];
      setCheckedList(checkboxValues as string[]);
    },
    [plainOptions]
  );
  const handelSelectOption = useCallback(() => {
    if (!columns) return;
    const newColumns = columns!.map((item) => ({
      ...item,
      hidden:
        item.key === "action"
          ? false
          : !checkedList.includes(item.key as string),
    }));
    setShowColumn(newColumns);
    setOpen(false);
  }, [columns, checkedList]);

  type TableRowSelection<T extends object = object> =
    TableProps<T>["rowSelection"];
  const onSelectChange = useCallback((newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  }, []);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const tableRowSelection: TableRowSelection<any> = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  const hasSelected = selectedRowKeys.length > 0;

  const [namespaces, setNamespaces] = useState<Array<Namespace>>([]);

  // Memoize namespace list fetching
  const list_namespaces = useCallback(async () => {
    try {
      const res = await kubeApi.get<Namespace>(AppsV1Url, "namespaces");
      setNamespaces(res);
    } catch (error) {
      console.error("Failed to fetch namespaces:", error);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    const parentDom = document.getElementById("my-table");
    const childDom = parentDom?.querySelector(".ant-table-body");
    childDom?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Memoize scrollbar visibility check
  const checkScrollbarVisibility = useCallback(() => {
    const parentDom = document.getElementById("my-table");
    const childDom = parentDom?.querySelector(".ant-table-body") as HTMLElement;
    if (childDom) {
      const hasVerticalScrollbar =
        childDom.scrollHeight > childDom.clientHeight;
      setShowScrollToTop(hasVerticalScrollbar);
    }
  }, []);

  useEffect(() => {
    list_namespaces();
  }, [list_namespaces]);

  useEffect(() => {
    checkScrollbarVisibility();
    const handleResize = () => {
      setTimeout(checkScrollbarVisibility, 100);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkScrollbarVisibility, filter(searchText), scroll.y]);

  const rowSelection = useMemo(
    () => (
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
    ),
    [
      plainOptions,
      checkedList,
      onChange,
      indeterminate,
      onCheckAllChange,
      handelSelectOption,
      formatMessage,
    ]
  );

  return (
    <>
      <div id="my-table" className="my-table relative">
        <div className={"table-header"}>
          <div className="left-section">
            <Button
              color="primary"
              variant="outlined"
              size="small"
              icon={<PlusOutlined />}
              onClick={onCreate}
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
              content={rowSelection}
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
            tableLayout="auto"
            rowSelection={tableRowSelection}
            className={styles.customTable}
            columns={showColumn}
            dataSource={filter(searchText)}
            loading={loading}
            rowKey={(record: any) =>
              (record as any).metadata?.uid || Math.random().toString()
            }
            scroll={scroll}
            pagination={false}
          />
        </div>
        {showScrollToTop && (
          <Affix
            offsetBottom={50}
            className="affix-bottom"
            style={{
              position: "absolute",
              right: 110,
              bottom: 40,
              zIndex: 1000,
            }}
          >
            <MyIcon
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
