import { Button, Table, TableColumnsType } from "antd";
import { FC, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Windows from "@/utils/windows";
import { aboutWindow } from "@/utils/windows/actions";
import CreateAboutWindow from "@/pages/About/window";
const createWindow = async () => {
  await aboutWindow();
};

interface DataType {
  key: React.Key;
  name: string;
  age: number;
  address: string;
}

const columns: TableColumnsType<DataType> = [
  {
    title: "Name",
    dataIndex: "name",
    width: 150,
  },
  {
    title: "Age",
    dataIndex: "age",
    width: 150,
  },
  {
    title: "Address",
    dataIndex: "address",
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
  const cluster = params.get("cluster");
  // const dispatch = useAppDispatch();
  const w = new Windows();
  useEffect(() => {
    w.listen();
    if (!cluster) return;
    // dispatch(setActiveCluster(cluster))
  }, [cluster]);

  return (
    <>
      <div>
        <Button type="primary" size="small" onClick={createWindow}>
          点击
        </Button>
        <Button type="primary" size="small" onClick={CreateAboutWindow}>
          关于
        </Button>
        <Table
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 50 }}
          scroll={{ y: 240 }}
        />{" "}
      </div>
    </>
  );
};

export default Dashboard;
