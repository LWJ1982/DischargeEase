// src/components/layout/Navbar.tsx
import { Layout, Space, Typography, Avatar, Button, Tag } from "antd";
import { useAuth } from "../../contexts/AuthContext";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import GlobalLoader from "../common/GlobalLoader";

const { Header } = Layout;

const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return <GlobalLoader />;

  return (
    <Header
      style={{
        background: "#fff",
        padding: "0 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: 64,
      }}
    >
      <Typography.Title
        level={4}
        style={{ margin: 0, cursor: "pointer" }}
        onClick={() => navigate("/dashboard")}
      >
        DischargeEase
      </Typography.Title>

      <Space align="center" size="middle">
        <Tag color="blue">{user?.role}</Tag>
        <Avatar icon={<UserOutlined />} />
        <span>{user?.name}</span>
        <Button onClick={logout} size="small" danger>
          Logout
        </Button>
      </Space>
    </Header>
  );
};

export default Navbar;
