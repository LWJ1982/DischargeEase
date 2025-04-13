// src/components/RegisterForm.tsx
import { Form, Input, Button, message } from "antd";
import { register } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";

interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleRegister = async (values: RegisterValues) => {
    try {
      await register({ ...values, role: "nurse" });
      message.success("Registration successful. Please login.");
      navigate("/login");
    } catch (err) {
      const error = err as AxiosError;
      message.error(
        (error.response?.data as any)?.message || "Registration failed"
      );
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleRegister}>
      <Form.Item name="name" label="Name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
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
      <Form.Item
        name="confirmPassword"
        label="Confirm Password"
        dependencies={["password"]}
        rules={[
          { required: true },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value)
                return Promise.resolve();
              return Promise.reject(new Error("Passwords do not match!"));
            },
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Register
        </Button>
      </Form.Item>
    </Form>
  );
};

export default RegisterForm;
