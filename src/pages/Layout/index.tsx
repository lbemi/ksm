import React, { useEffect, useState } from "react";
import { VideoCameraOutlined } from "@ant-design/icons";
import { Button, Card, Layout, Menu, MenuProps, theme } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import TopBar from "@/components/TopBar";
import "./index.scss";
import WindowOperation from "@/components/WindowOperation";

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
    token: { colorBgContainer },
  } = theme.useToken();

  const [locationPath, setLocationPath] = useState<string>(location.pathname);
  const [selectKeys, setSelectKeys] = useState<string[]>();
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const handleOnSelect = (key: string, keyPath: string[]) => {
    setSelectKeys(keyPath);
    handleMenuOpenChange(keyPath);
    navigate(key);
    setOpenKeys(keyPath);
  };
  const handleMenuOpenChange = (keys: string[]) => {
    let openKeyList: string[] = keys;
    if (openKeyList.length === 0) {
      openKeyList = locationPath.split("/").slice(1);
      openKeyList.pop();
      openKeyList = ["/" + openKeyList.join("/")];
    }
    setOpenKeys(openKeyList);
  };

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setSelectKeys([location.pathname]);
    const openKey = location.pathname.split("/").slice(1);
    openKey.pop();
    setOpenKeys(["/" + openKey.join("/")]);
    setLocationPath(location.pathname);
  }, [location.pathname]);

  return (
    <div>
      <Layout>
        <Sider collapsed={collapsed} style={{ background: colorBgContainer }}>
          <img
            data-tauri-drag-region
            style={{
              maxHeight: 30,
              maxWidth: 30,
              userSelect: "none",
              marginLeft: 10,
              marginTop: 10,
            }}
            src="/ksmlog.png"
            alt=""
          />
          <Menu
            theme="light"
            mode="inline"
            openKeys={openKeys}
            onSelect={({ keyPath, key }) => handleOnSelect(key, keyPath)}
            selectedKeys={selectKeys}
            onOpenChange={handleMenuOpenChange}
            forceSubMenuRender
            items={items}
          />
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />
        </Sider>
        <Layout>
          <Header
            data-tauri-drag-region
            style={{ padding: 0, background: colorBgContainer }}
          >
            <TopBar />

            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: "16px",
                width: 64,
                height: 64,
              }}
            />
          </Header>
          <Content>
            {/* <Card className="card-container"> */}
            <Outlet />
            {/* </Card> */}
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default GeekLayout;
