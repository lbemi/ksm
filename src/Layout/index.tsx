import React, { useEffect, useState } from "react";
import {
  Breadcrumb,
  Button,
  Divider,
  Layout,
  Menu,
  MenuProps,
  Select,
  theme,
} from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  VideoCameraOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import Settings from "@/components/Settings";
import "./index.scss";
import { Namespace } from "kubernetes-models/v1";
import { kubernetes_request } from "@/api/cluster";
import { useAppDispatch } from "@/store/hook";
import { setActiveNamespace } from "@/store/modules/kubernetes";
import { get } from "@/utils/localStorage";
import Title from "antd/es/typography/Title";
import { Footer } from "antd/es/layout/layout";

const { Header, Content, Sider } = Layout;
type MenuItem = Required<MenuProps>["items"][number];
const items: MenuItem[] = [
  {
    label: "集群列表",
    key: "/",
    icon: <VideoCameraOutlined />,
  },
  {
    label: "Dashboard",
    key: "/kubernetes/dashboard",
    icon: <VideoCameraOutlined />,
  },
  {
    key: "/kubernetes/workload",
    label: "工作负载",
    // type: "group",
    icon: <VideoCameraOutlined />,
    children: [
      {
        key: "/kubernetes/workload/deployment",
        label: "Deployment",
        icon: <VideoCameraOutlined />,
      },
      {
        key: "/kubernetes/workload/pod",
        label: "Pod",
        icon: <VideoCameraOutlined />,
      },
      {
        key: "/kubernetes/workload/statefulset",
        label: "StatefulSet",
        icon: <VideoCameraOutlined />,
      },
      {
        key: "/kubernetes/workload/daemonset",
        label: "DaemonSet",
        icon: <VideoCameraOutlined />,
      },
    ],
  },
  {
    key: "/kubernetes/network",
    label: "网络",
    // type: "group",
    icon: <VideoCameraOutlined />,
    children: [
      {
        key: "/kubernetes/network/service",
        label: "Service",
        icon: <VideoCameraOutlined />,
      },
      {
        key: "/kubernetes/network/ingress",
        label: "Ingress",
        icon: <VideoCameraOutlined />,
      },
    ],
  },
  {
    key: "/kubernetes/config",
    label: "配置",
    icon: <VideoCameraOutlined />,
    children: [
      {
        key: "/kubernetes/config/configmap",
        label: "ConfigMap",
        icon: <VideoCameraOutlined />,
      },
      {
        key: "/kubernetes/config/secret",
        label: "Secret",
        icon: <VideoCameraOutlined />,
      },
    ],
  },
  {
    key: "/kubernetes/task",
    label: "任务",
    icon: <VideoCameraOutlined />,
    children: [
      {
        key: "/kubernetes/task/job",
        label: "Job",
        icon: <VideoCameraOutlined />,
      },
      {
        key: "/kubernetes/task/cronjob",
        label: "CronJob",
        icon: <VideoCameraOutlined />,
      },
    ],
  },
  {
    key: "/kubernetes/storage",
    label: "存储",
    icon: <VideoCameraOutlined />,
    children: [
      {
        key: "/kubernetes/storage/persistentvolume",
        label: "PV",
        icon: <VideoCameraOutlined />,
      },
      {
        key: "/kubernetes/storage/persistentvolumeclaim",
        label: "PVC",
        icon: <VideoCameraOutlined />,
      },
      {
        key: "/kubernetes/storage/storageclass",
        label: "StorageClass",
        icon: <VideoCameraOutlined />,
      },
    ],
  },
  {
    key: "/kubernetes/crd",
    label: "自定义资源",
    icon: <VideoCameraOutlined />,
  },
];

const GeekLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [locationPath, setLocationPath] = useState<string>(location.pathname);
  const [selectKeys, setSelectKeys] = useState<string[]>();
  const [collapsed, setCollapsed] = useState(false);
  const [namespaces, setNamespaces] = useState<Array<Namespace>>([]);

  const handleOnSelect = (key: string, keyPath: string[]) => {
    setSelectKeys(keyPath);
    handleMenuOpenChange(keyPath);
    navigate(key);
  };
  const handleMenuOpenChange = (keys: string[]) => {
    let openKeyList: string[] = keys;
    if (openKeyList.length === 0) {
      openKeyList = locationPath.split("/").slice(1);
      openKeyList.pop();
      openKeyList = ["/" + openKeyList.join("/")];
    }
  };

  const list_namespaces = () => {
    kubernetes_request<Array<Namespace>>(
      "GET",
      "/api/v1/namespaces?limit=500"
    ).then((res) => {
      setNamespaces(res);
    });
  };

  useEffect(() => {
    list_namespaces();
  }, []);

  useEffect(() => {
    setSelectKeys([location.pathname]);
    const openKey = location.pathname.split("/").slice(1);
    openKey.pop();
    setLocationPath(location.pathname);
  }, [location.pathname]);
  const { token } = theme.useToken();
  return (
    <>
      <Layout style={{ minHeight: "100vh", padding: "0" }}>
        <Header
          data-tauri-drag-region
          style={{
            display: "flex",
            alignItems: "center",
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            height: "60px",
            padding: "0 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginLeft: "50px",
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
          </div>
          <div
            style={{
              textAlign: "center",
              background: colorBgContainer,
              marginLeft: "100px",
            }}
          >
            <Title level={5} style={{ margin: "0" }}>
              当前集群: {get("activeCluster")}
            </Title>
          </div>
          <span
            style={{ fontSize: "14px", fontWeight: "bold", margin: "0 20px" }}
          >
            命名空间:
          </span>
          <Select
            style={{ width: 200 }}
            defaultValue={get("namespace") || "default"}
            size="small"
            options={[
              { value: "all", label: "全部命名空间" },
              ...namespaces.map((namespace) => ({
                value: namespace.metadata!.name,
                label: <span>{namespace.metadata!.name}</span>,
              })),
            ]}
            onChange={(value) => {
              dispatch(setActiveNamespace(value));
            }}
          />
          <Button
            variant="link"
            color="primary"
            onClick={() => {
              list_namespaces();
            }}
            icon={<ReloadOutlined />}
          ></Button>
          <Settings />
        </Header>
        <Layout>
          <Sider trigger={null} collapsible collapsed={collapsed}>
            <Menu
              mode="inline"
              onSelect={({ keyPath, key }) => handleOnSelect(key, keyPath)}
              selectedKeys={selectKeys}
              onOpenChange={handleMenuOpenChange}
              forceSubMenuRender
              items={items}
              style={{
                height: "100%",
                background: colorBgContainer,
              }}
            />
          </Sider>
          <Layout>
            {/* <Breadcrumb
              items={location.pathname.split("/").map((path, _index, _arr) => ({
                title: path,
              }))}
              style={{ margin: "16px 0" }}
            /> */}
            <Content
              style={{
                padding: 0,
                margin: 0,
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
              }}
            >
              <Outlet />
            </Content>
          </Layout>
        </Layout>
        <Footer
          style={{
            height: "30px",
            padding: "0",
            backgroundColor: token.colorBgContainer,
          }}
        >
          <Divider style={{ margin: "0" }} />
          <div
            style={{
              userSelect: "none",
              cursor: "default",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "25px",
            }}
          >
            <span>WRITTEN BY LBEMI @2025 版权所有</span>
          </div>
        </Footer>
      </Layout>
    </>
  );
};

export default GeekLayout;
