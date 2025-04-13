// src/components/layout/AppLayout.tsx
import { Layout } from "antd";
import { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const { Content, Footer, Sider } = Layout;

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={200} theme="light">
        <Sidebar />
      </Sider>

      <Layout>
        <Navbar />

        <Content style={{ margin: "24px 16px 0" }}>
          <div
            style={{
              padding: 24,
              background: "#fff",
              minHeight: 360,
              borderRadius: 8,
            }}
          >
            {children}
          </div>
        </Content>

        <Footer style={{ textAlign: "center" }}>
          ©2025 DischargeEase — Integrated Discharge Platform
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
