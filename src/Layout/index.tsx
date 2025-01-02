import React, { useEffect, useState } from "react";
import { Breadcrumb, Button, Layout, Menu, MenuProps, theme } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  VideoCameraOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from "@ant-design/icons";
import Settings from "@/components/Settings";
import "./index.scss";

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
    ],
  },
];

const GeekLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // 这句代码使用了 Ant Design 的 theme.useToken() 钩子函数来获取当前主题的 token 值。
  // 它解构出了 token 对象中的 colorBgContainer 和 borderRadiusLG 两个属性。
  // colorBgContainer 通常用于设置容器的背景色。
  // borderRadiusLG 通常用于设置大尺寸的边框圆角。
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [locationPath, setLocationPath] = useState<string>(location.pathname);
  const [selectKeys, setSelectKeys] = useState<string[]>();
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

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setSelectKeys([location.pathname]);
    const openKey = location.pathname.split("/").slice(1);
    openKey.pop();
    setLocationPath(location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Layout style={{ minHeight: "100vh" }}>
        <Header
          data-tauri-drag-region
          style={{
            display: "flex",
            alignItems: "center",
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            height: "53px",
          }}
        >
          <div style={{ marginLeft: "160px" }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
          </div>
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
          <Layout style={{ padding: "0 24px 24px" }}>
            <Breadcrumb
              items={location.pathname.split("/").map((path, _index, _arr) => ({
                title: path,
              }))}
              style={{ margin: "16px 0" }}
            />
            <Content
              style={{
                padding: 24,
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
