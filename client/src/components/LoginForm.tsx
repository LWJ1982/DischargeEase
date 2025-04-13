// src/components/LoginForm.tsx
import { Form, Input, Button, message } from "antd";
import { login } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AxiosError } from "axios";

interface LoginValues {
  email: string;
  password: string;
}

const LoginForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login: doLogin } = useAuth();

  const handleLogin = async (values: LoginValues) => {
    try {
      const res = await login(values);
      doLogin(res.data.accessToken, res.data.user);
      message.success("Login successful");
      navigate("/profile");
    } catch (err) {
      const error = err as AxiosError;

      if (error.response) {
        console.error(
          "🔴 Login failed with response data:",
          error.response.data
        );
        console.error("🔴 Status code:", error.response.status);
        console.error("🔴 Headers:", error.response.headers);

        message.error((error.response.data as any)?.message || "Login failed");
      } else if (error.request) {
        console.error("🟡 Request made but no response:", error.request);
        message.error("No response from server");
      } else {
        console.error("⚠️ Other error:", error.message);
        message.error("Unexpected error occurred");
      }
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleLogin}>
      <Form.Item
        name="email"
        label="Email"
        rules={[{ required: true, type: "email" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="password" label="Password" rules={[{ required: true }]}>
        <Input.Password />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Login
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LoginForm;
