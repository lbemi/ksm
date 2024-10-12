import { useAppDispatch } from "@/store/hook";
import { setActiveCluster } from "@/store/modules/kubernetes";
import { Table, TableColumnsType } from "antd";
import { FC, useEffect, } from "react";
import { useSearchParams } from "react-router-dom";



interface DataType {
  key: React.Key;
  name: string;
  age: number;
  address: string;
}

const columns: TableColumnsType<DataType> = [
  {
    title: 'Name',
    dataIndex: 'name',
    width: 150,
  },
  {
    title: 'Age',
    dataIndex: 'age',
    width: 150,
  },
  {
    title: 'Address',
    dataIndex: 'address',
  },
];

const data: DataType[] = [];
for (let i = 0; i < 100; i++) {
  data.push({
    key: i,
    name: `Edward King ${i}`,
    age: 32,
    address: `London, Park Lane no. ${i}`,
  });
}

const Dashboard: FC = () => {
  const [params] = useSearchParams();
  const cluster = params.get("cluster")
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!cluster) return
    dispatch(setActiveCluster(cluster))
  }, [cluster])

  return <div>
    <Table columns={columns} dataSource={data} pagination={{ pageSize: 50 }} scroll={{ y: 240 }} /> </div>;
};

export default Dashboard;
