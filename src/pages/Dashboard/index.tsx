import { Button, Table, TableColumnsType } from "antd";
import { FC, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Windows from "@/utils/windows";
import { aboutWindow } from "@/utils/windows/actions";

const createWindow = async () => {
  // const window = new Windows();
  // // await window.listen();
  // await window.createWindow({
  //   label: "about",
  //   title: "关于我们",
  //   url: "/kubernetes",
  //   width: 480,
  //   height: 360,
  //   x: 100,
  //   y: 200,
  // });
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
    <div>
      <Button type="primary" size="small" onClick={createWindow}>
        点击
      </Button>
      <Table
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 50 }}
        scroll={{ y: 240 }}
      />{" "}
    </div>
  );
};

export default Dashboard;
