import React, { useState } from "react";
import {
  Card,
  Col,
  Divider,
  Progress,
  Row,
  Typography,
  Button,
  Tag,
  List,
} from "antd";

import type { SplitterProps } from "antd";
import { useLocale } from "@/locales";
import "./index.scss";
import {
  CheckCircleOutlined,
  ExclamationCircleFilled,
  InfoCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import MyIcon from "@/components/MyIcon";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import dayjs from "dayjs";
// const _wrapperCol: ColProps = {
//   xs: 24,
//   sm: 24,
//   md: 12,
//   lg: 12,
//   xl: 12,
//   xxl: 6,
// };
const CustomSplitter: React.FC<Readonly<SplitterProps>> = () => {
  const { formatMessage: _formatMessage } = useLocale();
  const { Text } = Typography;
  const [timeRange, setTimeRange] = useState("五分钟");

  // 系统告警数据
  const alertData = [
    {
      id: 1,
      title: "磁盘空间不足",
      time: "10分钟前",
      description: "node-02 磁盘使用率超过85%",
      level: "warning",
      levelText: "警告",
      levelColor: "red",
    },
    {
      id: 2,
      title: "Pod重启次数过多",
      time: "35分钟前",
      description: "worker-jobs-7f92d 在1小时内重启5次",
      level: "notice",
      levelText: "注意",
      levelColor: "orange",
    },
    {
      id: 3,
      title: "节点资源压力",
      time: "2小时前",
      description: "node-03 CPU使用率持续高于70%",
      level: "info",
      levelText: "信息",
      levelColor: "blue",
    },
  ];

  // 最近事件数据
  const [eventFilter, setEventFilter] = useState("全部");
  const eventData = [
    {
      id: 1,
      title: "api-service 已成功部署",
      time: "2分钟前",
      description: "Deployment/api-service 已更新至版本 v2.4.1",
      type: "deployment",
      status: "success",
      icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      tags: ["deployment", "default"],
    },
    {
      id: 2,
      title: "web-frontend 已扩展",
      time: "15分钟前",
      description: "从3个副本扩展到5个副本以应对流量增长",
      type: "scaling",
      status: "info",
      icon: <InfoCircleOutlined style={{ color: "#1890ff" }} />,
      tags: ["horizontalpodautoscaler", "frontend"],
    },
    {
      id: 3,
      title: "worker-jobs 启动失败",
      time: "45分钟前",
      description: "Pod worker-jobs-7f92d 因配置错误启动失败",
      type: "error",
      status: "error",
      icon: <ExclamationCircleFilled style={{ color: "#ff4d4f" }} />,
      tags: ["pod", "jobs"],
    },
  ];

  const filteredEvents =
    eventFilter === "全部"
      ? eventData
      : eventData.filter((event) => event.type === eventFilter.toLowerCase());

  // 生成资源使用率数据
  const generateResourceData = () => {
    const data = [];
    const now = new Date();
    let dataPoints = 5; // 五分钟

    if (timeRange === "一小时") {
      dataPoints = 60; // 一小时
    } else if (timeRange === "三小时") {
      dataPoints = 360; // 三小时
    }

    for (let i = 0; i < dataPoints; i++) {
      let time;
      if (timeRange === "五分钟") {
        time = new Date(now.getTime() - (dataPoints - 1 - i) * 5 * 60 * 1000);
      } else if (timeRange === "一小时") {
        time = new Date(now.getTime() - (dataPoints - 1 - i) * 60 * 60 * 1000);
      } else if (timeRange === "三小时") {
        time = new Date(
          now.getTime() - (dataPoints - 1 - i) * 3 * 60 * 60 * 1000
        );
      } else {
        time = new Date(
          now.getTime() - (dataPoints - 1 - i) * 24 * 60 * 60 * 1000
        );
      }

      // 生成更真实的数据模式
      const hour = time.getHours();
      const baseCpu = 20 + Math.sin((hour / 24) * Math.PI * 2) * 15; // 20-35%基础
      const baseMemory =
        40 + Math.sin((hour / 24) * Math.PI * 2 + Math.PI) * 20; // 40-60%基础

      const cpuUsage = Math.max(
        0,
        Math.min(100, baseCpu + (Math.random() - 0.5) * 10)
      );
      const memoryUsage = Math.max(
        0,
        Math.min(100, baseMemory + (Math.random() - 0.5) * 15)
      );

      data.push({
        time: time.toISOString(),
        cpu: cpuUsage,
        memory: memoryUsage,
        type: "CPU使用率",
      });
    }
    return data;
  };
  // interface _WorkLoad {
  //   name: string;
  //   value: number;
  // }
  const data = [
    { name: "Deployment", value: 20 },
    { name: "Pod", value: 38 },
    { name: "StatefulSet", value: 7 },
    { name: "DaemonSet", value: 10 },
    { name: "Job", value: 2 },
    { name: "CronJob", value: 4 },
  ];
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#722ed1",
    "#f5222d",
  ];
  // const _renderLegend = (props: any) => {
  //   const { payload } = props;
  //
  //   return (
  //     <ul>
  //       {payload.map((entry: any, index: any) => (
  //         <li key={`item-${index}`}>
  //           {entry.value}:{entry.payload.value}
  //         </li>
  //       ))}
  //     </ul>
  //   );
  // };
  return (
    <div className="overflow-auto h-lvh ">
      <Row gutter={16} className="p-1">
        <Col>
          <Card style={{ width: "265px" }} hoverable>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Text>集群节点</Text>
                <span className="text-2xl font-bold">3 个</span>
                <span className="text-xs text-green-500">
                  <CheckCircleOutlined /> 全部正常运行
                </span>
              </div>
              <div className="absolute top-6 right-2 rounded-md bg-blue-50 pl-2 pr-2 ">
                <MyIcon type="icon-fuwuqi1" size={30} color="#1677ff" />
              </div>
            </div>
            <Divider />
            <span className="text-xs">CPU使用率</span>
            <Progress
              percent={70}
              className="ant-progress-outer"
              // percentPosition={{ align: "end", type: "outer" }}
            />
          </Card>
        </Col>
        <Col>
          <Card style={{ width: "265px" }} hoverable>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Text>运行中的Pod</Text>
                <span className="text-2xl font-bold">24 个</span>
                <span className="text-xs text-green-500">
                  <CheckCircleOutlined /> 24/24 正常运行
                </span>
              </div>
              <div className="absolute top-6 right-2 rounded-md bg-blue-50 pl-2 pr-2 ">
                <MyIcon type="icon-pod" size={30} color="#4eaeea" />
              </div>
            </div>
            <Divider />
            <span className="text-xs">内存使用率</span>
            <Progress
              percent={45}
              className="ant-progress-outer"
              strokeColor={"#4eaeea"}
            />
          </Card>
        </Col>
        <Col>
          <Card style={{ width: "265px" }} hoverable>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Text>服务与Ingress</Text>
                <span className="text-2xl font-bold">18 / 7</span>
                <span className="text-xs text-green-500">
                  <CheckCircleOutlined /> 全部可用
                </span>
              </div>
              <div className="absolute top-6 right-2 rounded-md bg-blue-50 pl-2 pr-2 ">
                <MyIcon
                  type="icon-a-36icon_network"
                  size={28}
                  color="#faad14"
                />
              </div>
            </div>
            <Divider />
            <span className="text-xs">活跃连接数</span>
            <Progress
              percent={45}
              className="ant-progress-outer"
              strokeColor={"#faad14"}
            />
          </Card>
        </Col>
        <Col>
          <Card style={{ width: "265px" }} hoverable>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Text>存储使用</Text>
                <span className="text-2xl font-bold">2.4G / 3.0T</span>
                <span className="text-xs text-red-500">
                  <InfoCircleOutlined /> 空间使用率极高
                </span>
              </div>
              <div className="absolute top-6 right-2 rounded-md bg-blue-50 pl-2 pr-2 ">
                <MyIcon type="icon-cunchu" size={28} color="#eb2f96" />
              </div>
            </div>
            <Divider />
            <span className="text-xs">存储使用率</span>
            <Progress
              percent={95}
              className="ant-progress-outer"
              strokeColor={"#eb2f96"}
            />
          </Card>
        </Col>
      </Row>
      <Row className="p-1" gutter={16}>
        <Col>
          <Card style={{ width: "700px" }}>
            <div className="flex items-center justify-between">
              <div>资源使用率趋势</div>
              <div style={{ display: "flex", gap: "8px" }}>
                {["五分钟", "一小时", "三小时"].map((range) => (
                  <Button
                    key={range}
                    type={timeRange === range ? "primary" : "dashed"}
                    size="small"
                    // color="primary"
                    // variant="filled"
                    shape="round"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={245}>
              <AreaChart data={generateResourceData()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="time"
                  tickFormatter={(d) => dayjs(d).format("HH:mm")}
                  tickSize={3}
                />
                <YAxis
                  tickFormatter={(v: any) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(v: any) => `${v.toFixed(1)}%`} />
                <Legend verticalAlign="top" height={36} />
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="cpu"
                  // stackId="1"
                  stroke="#8884d8"
                  fill="url(#colorCpu)"
                  fillOpacity={0.5}
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  // stackId="2"
                  stroke="#82ca9d"
                  fill="url(#colorMem)"
                  fillOpacity={0.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col>
          <Card style={{ width: "390px" }}>
            <h1>工作负载分布</h1>
            <ResponsiveContainer width="100%" height={245}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {data.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
      <Row className="p-1" gutter={16}>
        <Col>
          <Card
            style={{ width: "700px" }}
            title={<span>系统告警</span>}
            extra={
              <div>
                <Tag color="red">{alertData.length}个活跃告警</Tag>
                <Button type="primary" size="small">
                  查看所有告警
                </Button>
              </div>
            }
          >
            <List
              dataSource={alertData}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <List.Item.Meta
                    title={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{item.title}</span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Tag color={item.levelColor}>{item.levelText}</Tag>
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            <ClockCircleOutlined
                              style={{ marginRight: "4px" }}
                            />
                            {item.time}
                          </Text>
                        </div>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: "8px", color: "#666" }}>
                          {item.description}
                        </div>
                        <Button
                          type="link"
                          size="small"
                          icon={<EyeOutlined />}
                          style={{ padding: 0, height: "auto" }}
                        >
                          查看详情
                        </Button>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col>
          <Card
            style={{ width: "390px" }}
            title="最近事件"
            extra={
              <div style={{ display: "flex", gap: "4px" }}>
                {["全部", "部署", "扩展", "错误"].map((filter) => (
                  <Button
                    key={filter}
                    type={eventFilter === filter ? "primary" : "default"}
                    size="small"
                    onClick={() => setEventFilter(filter)}
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            }
          >
            <List
              dataSource={filteredEvents}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <List.Item.Meta
                    avatar={item.icon}
                    title={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{item.title}</span>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          <ClockCircleOutlined style={{ marginRight: "4px" }} />
                          {item.time}
                        </Text>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: "8px", color: "#666" }}>
                          {item.description}
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {item.tags.map((tag) => (
                            <Tag key={tag} color="blue">
                              {tag}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <Button type="primary" size="small">
                查看所有事件
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const Dashboard: React.FC = () => (
  <CustomSplitter
    style={{ height: "100vh", overflow: "hidden" }}
    layout="vertical"
  />
);

export default Dashboard;
