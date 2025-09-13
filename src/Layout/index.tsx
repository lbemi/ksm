import { useEffect, useState } from "react";
import { Button, Divider, Layout, Menu, MenuProps, Tag, theme } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import Settings from "@/components/Settings";
import "./index.scss";

import { get } from "@/utils/localStorage";
import Title from "antd/es/typography/Title";
import { useLocale } from "@/locales";
import UIcon from "@/components/UIcon";

const { Header, Content, Sider } = Layout;
type MenuItem = Required<MenuProps>["items"][number];

const GeekLayout = () => {
  const { formatMessage } = useLocale();
  const items: MenuItem[] = [
    {
      label: formatMessage({ id: "menu.clusters" }),
      key: "/",
      icon: <UIcon type="icon-jiqun" />,
    },
    {
      label: formatMessage({ id: "menu.dashboard" }),
      key: "/kubernetes/dashboard",
      icon: <UIcon type="icon-dashboard" />,
    },
    {
      key: "/kubernetes/workload",
      label: formatMessage({ id: "menu.workload" }),
      // type: "group",
      icon: <UIcon type="icon-lianbanggongzuofuzai" />,
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
      // type: "group",
      icon: <UIcon type="icon-wangluo" />,
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
      icon: <UIcon type="icon-peizhi" />,
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
      icon: <UIcon type="icon-renwu" />,
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
      icon: <UIcon type="icon-cunchu" />,
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
      icon: <UIcon type="icon-zidingyiziyuan" />,
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
  return (
    <>
      <Layout style={{ minHeight: "100vh", background: colorBgContainer }}>
        <Header
          data-tauri-drag-region
          style={{
            display: "flex",
            alignItems: "center",
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            padding: "0 20px",
            height: "35px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginLeft: left,
              transition: "margin-left 0.3s ease-in-out",
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
          <div
            style={{
              textAlign: "center",
              background: colorBgContainer,
              marginLeft: "10px",
            }}
          >
            <Title
              level={5}
              style={{ margin: "0", cursor: "default", userSelect: "none" }}
            >
              {formatMessage({ id: "cluster.current" })}:{" "}
              <Tag color="blue" bordered={false}>
                {get("activeCluster")}
              </Tag>
            </Title>
          </div>
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
            {/* <div
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
                <span>Kubernetes Manager - v0.0.1</span>
              </div>
            </div> */}
          </Layout>
        </Layout>
      </Layout>
    </>
  );
};

export default GeekLayout;
