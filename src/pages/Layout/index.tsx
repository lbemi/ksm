import React, { useEffect, useState } from 'react';
import { VideoCameraOutlined } from '@ant-design/icons';
import { Card, Layout, Menu, MenuProps, theme } from 'antd';
import { Outlet, useLocation, useNavigate, } from 'react-router-dom';
import { Footer } from 'antd/es/layout/layout';

const { Header, Content, Sider } = Layout;
type MenuItem = Required<MenuProps>['items'][number];
const items: MenuItem[] = [
  {
    label: 'Dashboard',
    key: '/kubernetes',
    icon: <VideoCameraOutlined />,
  },
  {
    key: '/kubernetes/workload',
    label: 'workload',
    icon: <VideoCameraOutlined />,
    children: [
      {
        key: '/kubernetes/workload/deployment',
        label: 'Deployment',
        icon: <VideoCameraOutlined />,
      },
      {
        key: '/kubernetes/workload/pod',
        label: 'Pod',
        icon: <VideoCameraOutlined />,
      }
    ]
  }
]

const GeekLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [locationPath, setLocationPath] = useState<string>(location.pathname)
  const [selectKeys, setSelectKeys] = useState<string[]>()
  const [openKeys, setOpenKeys] = useState<string[]>([])
  const handleOnSelect = (key: string, keyPath: string[]) => {
    setSelectKeys(keyPath)
    handleMenuOpenChange(keyPath)
    navigate(key)
    setOpenKeys(keyPath)
  }
  const handleMenuOpenChange = (keys: string[]) => {
    let openKeyList: string[] = keys
    if (openKeyList.length === 0) {
      openKeyList = locationPath.split('/').slice(1)
      openKeyList.pop()
      openKeyList = ['/' + openKeyList.join('/')]
    }
    setOpenKeys(openKeyList)
  }
  useEffect(() => {
    setSelectKeys([location.pathname])
    const openKey = location.pathname.split('/').slice(1)
    openKey.pop()
    setOpenKeys(['/' + openKey.join('/')])
    setLocationPath(location.pathname)
  }, [location.pathname])

  return (
    <Layout>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          console.log(broken);
        }}
        onCollapse={(collapsed, type) => {
          console.log(collapsed, type);
        }}
      >
        <div className="demo-logo-vertical" />
        <Menu theme="dark"
          mode="inline"
          openKeys={openKeys}
          onSelect={({ keyPath, key }) => handleOnSelect(key, keyPath)}
          selectedKeys={selectKeys}
          onOpenChange={handleMenuOpenChange}
          forceSubMenuRender
          items={items} />

      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '24px 16px 0' }} className='card-container'>
          <Card  className='card-container' >
            <Outlet />
          </Card>
          {/* <div
            style={{
              padding: 14,
              height: '100%',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              marginBottom: 24,
            }}
          >
            <Outlet />

          </div> */}
        </Content>

      </Layout>
    </Layout>
  );
};

export default GeekLayout;