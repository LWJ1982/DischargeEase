// src/pages/Login.tsx
import { Card, Typography } from "antd";
import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";

const { Text } = Typography;

const Login = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        flexDirection: "column",
      }}
    >
      <Card title="Nurse Login" style={{ width: 400 }}>
        <LoginForm />
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <Text type="secondary">
            No account? Sign up <Link to="/register">here</Link>.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
