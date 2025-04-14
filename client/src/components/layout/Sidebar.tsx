// src/components/layout/Sidebar.tsx
import { Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  ProfileOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/patients",
      icon: <UserOutlined />,
      label: "Patients",
    },
    {
      key: "/services",
      icon: <CalendarOutlined />,
      label: "Services",
    },
    {
      key: "/profile",
      icon: <ProfileOutlined />,
      label: "Profile",
    },
  ];

  return (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      onClick={({ key }) => navigate(key)}
      style={{ height: "100%", borderRight: 0 }}
      items={items}
    />
  );
};

export default Sidebar;
