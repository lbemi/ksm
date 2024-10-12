import { useAppSelector } from "@/store/hook";
import { invoke } from "@tauri-apps/api/core";
import { Button, Checkbox, CheckboxProps, Popover, Space, Table, TableProps } from "antd";
import dayjs from "dayjs";
import { Pod } from "kubernetes-models/v1";
import { FC, useEffect, useState } from "react";
import { PicRightOutlined } from '@ant-design/icons';
import { CheckboxOptionType, CheckboxValueType } from "antd/es/checkbox/Group";
import "./index.scss"

const columns: TableProps<Pod>['columns'] = [
  {
    title: 'name',
    dataIndex: ['metadata', 'name'],
    key: 'name',

    render: (text) => <a>{text}</a>,
  },
  {
    title: 'create_time',
    dataIndex: ['metadata', 'creationTimestamp'],
    key: 'create_time',
    defaultSortOrder: 'descend',
    sorter: (a, b) => dayjs(a.metadata?.creationTimestamp).valueOf() - dayjs(b.metadata?.creationTimestamp).valueOf(),
    render: (text) => <a>{dayjs(text).format("YYYY-MM-DD HH:mm:ss")}</a>,
  },
  {
    title: 'Action',
    key: 'action',
    fixed: 'right',
    dataIndex: 'action',
    render: () => (
      <Space size="middle">
        <a>Log</a>
      </Space>
    ),
  },
];
const CheckboxGroup = Checkbox.Group;
const defaultCheckedList = ['name', 'create_time', 'action'];

const PodPage: FC = () => {
  const [loading, setLoading] = useState(false)
  const clusterName = useAppSelector((state) => state.kubernetes.activeCluster)
  const [pods, setPods] = useState<Array<Pod>>([])
  const [showColumn, setShowColumn] = useState(columns)
  const plainOptions = columns.map(({ key, title }) => ({ label: title, value: key }));
  const [open, setOpen] = useState(false);
  const handleOpen = (open: boolean) => {
    setOpen(open);
  }
  const [checkedList, setCheckedList] = useState<CheckboxValueType[]>(defaultCheckedList);

  const checkAll = plainOptions.length === checkedList.length;
  const indeterminate = checkedList.length > 0 && checkedList.length < plainOptions.length;

  const onChange = (list: CheckboxValueType[]) => {
    setCheckedList(list);
  };

  const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
    const checkboxValues = e.target.checked ? plainOptions.map(option => option.value) : [];
    setCheckedList(checkboxValues as CheckboxValueType[]);
  };

  const rowSelection = () => {
    return <>
      
      <div>
        <CheckboxGroup options={plainOptions as CheckboxOptionType[]} value={checkedList} onChange={onChange} />
      </div>
      <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
        全选
      </Checkbox>
      <div className="select-option">
        <Button className="mr10" type="primary" size="small" onClick={handelSelectOption} >确定</Button>
        <Button className="ml10" size="small" onClick={() => handleOpen(false)}>取消</Button>
      </div>
    </>
  }
  const list_pods = async (clusterName: string, namespace: string) => {
    setLoading(true)
    await invoke("list_pods", { clusterName: clusterName, namespace: namespace }).then((res) => {
      setPods(res as Array<Pod>)
    }).catch((err) => {
      console.log("err: ", err);
    })
    setLoading(false)
  }
  useEffect(() => {
    if (!clusterName) return
    list_pods(clusterName, "default")
    handelSelectOption()
  }, [clusterName])

  const handelSelectOption = () => {
    const newColumns = columns.map((item) => ({
      ...item,
      hidden: !checkedList.includes(item.key as string),
    }));


    setShowColumn(newColumns)
    setOpen(false)
  }
  return <>
    <div className="div-header">
      <Popover trigger={"click"} placement="bottom" content={() => rowSelection()} open={open} onOpenChange={handleOpen}>
        <Button icon={<PicRightOutlined />} type="dashed">自定义列</Button>
      </Popover>
    </div>
    <Table className="table" scroll={{ y: 'calc(100vh - 320px)' }}  columns={showColumn} dataSource={pods} loading={loading} pagination={{showTotal: (total) => `共 ${total} 条`}} />
  </>;
};

export default PodPage;
