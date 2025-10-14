import { useEffect, useState } from "react";
import {
  Button,
  Divider,
  Layout,
  Menu,
  MenuProps,
  Tag,
  theme,
  Typography,
} from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import Settings from "@/components/Settings";
import "./index.scss";

import { useLocale } from "@/locales";
import MyIcon from "@/components/MyIcon";
import CheckUpdate from "@/components/CheckUpdate";

const { Header, Content, Sider } = Layout;
type MenuItem = Required<MenuProps>["items"][number];

const GeekLayout = () => {
  const { formatMessage } = useLocale();
  const items: MenuItem[] = [
    {
      label: formatMessage({ id: "menu.clusters" }),
      key: "/",
      icon: <MyIcon type="icon-jiqun" />,
    },
    {
      label: formatMessage({ id: "menu.dashboard" }),
      key: "/kubernetes/dashboard",
      icon: <MyIcon type="icon-dashboard" />,
    },
    {
      key: "/kubernetes/node",
      label: formatMessage({ id: "menu.node" }),
      icon: <MyIcon type="icon-fuwuqi1" />,
    },
    {
      key: "/kubernetes/namespace",
      label: formatMessage({ id: "menu.namespace" }),
      icon: <MyIcon type="icon-namespace" />,
    },
    {
      key: "/kubernetes/workload",
      label: formatMessage({ id: "menu.workload" }),
      icon: <MyIcon type="icon-lianbanggongzuofuzai" />,
      children: [
        {
          key: "/kubernetes/workload/deployment",
          label: formatMessage({ id: "menu.deployment" }),
        },
        {
          key: "/kubernetes/workload/pod",
          label: formatMessage({ id: "menu.pod" }),
        },
        {
          key: "/kubernetes/workload/statefulset",
          label: formatMessage({ id: "menu.statefulset" }),
        },
        {
          key: "/kubernetes/workload/daemonset",
          label: formatMessage({ id: "menu.daemonset" }),
        },
      ],
    },
    {
      key: "/kubernetes/network",
      label: formatMessage({ id: "menu.network" }),
      icon: <MyIcon type="icon-wangluo" />,
      children: [
        {
          key: "/kubernetes/network/service",
          label: formatMessage({ id: "menu.service" }),
        },
        {
          key: "/kubernetes/network/ingress",
          label: formatMessage({ id: "menu.ingress" }),
        },
      ],
    },
    {
      key: "/kubernetes/config",
      label: formatMessage({ id: "menu.config" }),
      icon: <MyIcon type="icon-peizhi" />,
      children: [
        {
          key: "/kubernetes/config/configmap",
          label: formatMessage({ id: "menu.configmap" }),
        },
        {
          key: "/kubernetes/config/secret",
          label: formatMessage({ id: "menu.secret" }),
        },
      ],
    },
    {
      key: "/kubernetes/task",
      label: formatMessage({ id: "menu.task" }),
      icon: <MyIcon type="icon-renwu" />,
      children: [
        {
          key: "/kubernetes/task/job",
          label: formatMessage({ id: "menu.job" }),
        },
        {
          key: "/kubernetes/task/cronjob",
          label: formatMessage({ id: "menu.cronjob" }),
        },
      ],
    },
    {
      key: "/kubernetes/storage",
      label: formatMessage({ id: "menu.storage" }),
      icon: <MyIcon type="icon-cunchu" />,
      children: [
        {
          key: "/kubernetes/storage/persistentvolume",
          label: formatMessage({ id: "menu.persistentvolume" }),
        },
        {
          key: "/kubernetes/storage/persistentvolumeclaim",
          label: formatMessage({ id: "menu.persistentvolumeclaim" }),
        },
        {
          key: "/kubernetes/storage/storageclass",
          label: formatMessage({ id: "menu.storageclass" }),
        },
      ],
    },
    {
      key: "/kubernetes/crd",
      label: formatMessage({ id: "menu.crd" }),
      icon: <MyIcon type="icon-zidingyiziyuan" />,
    },
  ];
  const location = useLocation();
  const navigate = useNavigate();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [selectKeys, setSelectKeys] = useState<string[]>();
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [left, setLeft] = useState("138px");

  const handleOnSelect = (key: string, keyPath: string[]) => {
    setSelectKeys(keyPath);
    handleMenuOpenChange(keyPath);
    navigate(key);
  };
  const handleMenuOpenChange = (keys: string[]) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    if (latestOpenKey) {
      setOpenKeys([latestOpenKey]);
    } else {
      setOpenKeys(keys);
    }
  };

  useEffect(() => {
    setSelectKeys([location.pathname]);
    const openKey = location.pathname.split("/").slice(1);
    openKey.pop();
    const parentKey = "/" + openKey.join("/");
    if (openKey.length > 0) {
      setOpenKeys([parentKey]);
    } else {
      setOpenKeys([]);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        typeof target.closest === "function" &&
        target.closest(".header")
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("selectstart", handleSelectStart);
    return () => {
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, []);
  return (
    <>
      <CheckUpdate />
      <Layout style={{ minHeight: "100vh", background: colorBgContainer }}>
        <Header
          data-tauri-drag-region
          className="header"
          onMouseDown={(e) => {
            if (e.detail > 1) {
              e.preventDefault();
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            padding: "0 20px",
            height: "35px",
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginLeft: left,
              transition: "margin-left 0.3s ease-in-out",
              height: "35px",
              justifyContent: "center",
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => {
                setCollapsed(!collapsed);
                setLeft(collapsed ? "138px" : "53px");
              }}
            />
          </div>

          <Typography.Text
            style={{
              margin: "0",
              cursor: "default",
            }}
          >
            {formatMessage({ id: "cluster.current" })}:
            <Tag color="blue" bordered={false} style={{ marginRight: 0 }}>
              {localStorage.getItem("activeCluster")}
            </Tag>
          </Typography.Text>
          <Settings />
        </Header>
        <Divider style={{ margin: "0" }} />
        <Layout>
          <Sider trigger={null} collapsible collapsed={collapsed} width={165}>
            <Menu
              mode="inline"
              onSelect={({ keyPath, key }) => handleOnSelect(key, keyPath)}
              selectedKeys={selectKeys}
              openKeys={openKeys}
              onOpenChange={handleMenuOpenChange}
              forceSubMenuRender
              items={items}
              className="h-full bg-theme-bg"
            />
          </Sider>

          <Layout>
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
      </Layout>
    </>
  );
};

export default GeekLayout;
