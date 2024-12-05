import React, { useEffect, useState } from "react";
import { VideoCameraOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Layout, Menu, MenuProps, theme } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import TopBar from "@/components/TopBar";
import "./index.scss";
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
    key: "/kubernetes",
    icon: <VideoCameraOutlined />,
  },
  {
    key: "/kubernetes/workload",
    label: "工作负载",
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
    <Layout>
      <Header
        // data-tauri-drag-region
        style={{
          // display: "flex",
          // alignItems: "center",
          backgroundColor: colorBgContainer,
        }}
      >
        <TopBar />

        <div className="logo" data-tauri-drag-region>
          <img
            data-tauri-drag-region
            style={{
              maxHeight: 30,
              maxWidth: 30,
              userSelect: "none",
            }}
            src="/ksmlog.png"
            alt=""
          />
          <div className="logo-title">KSM</div>
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: colorBgContainer }}>
          <Menu
            theme="light"
            mode="inline"
            // openKeys={openKeys}
            onSelect={({ keyPath, key }) => handleOnSelect(key, keyPath)}
            selectedKeys={selectKeys}
            onOpenChange={handleMenuOpenChange}
            forceSubMenuRender
            items={items}
          />
        </Sider>
        <Layout style={{ padding: "0 24px 24px" }}>
          <Breadcrumb
            items={[{ title: "Home" }, { title: "List" }, { title: "App" }]}
            style={{ margin: "16px 0" }}
          />
          <Content
            style={{
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Card
              style={{
                // height: "100%",
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
              }}
            >
              <Outlet />
            </Card>
          </Content>
          <Footer style={{ textAlign: "center" }}>
            Ant Design ©{new Date().getFullYear()} Created by Ant UED
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default GeekLayout;
