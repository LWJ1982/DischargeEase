// src/pages/Register.tsx
import { Card, Typography } from "antd";
import { Link } from "react-router-dom";
import RegisterForm from "../components/RegisterForm";

const { Text } = Typography;

const Register = () => {
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
      <Card title="Nurse Registration" style={{ width: 400 }}>
        <RegisterForm />
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <Text type="secondary">
            Existing user? Login <Link to="/login">here</Link>.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Register;
