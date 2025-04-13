// src/components/layout/PageContainer.tsx
import { Typography } from "antd";
import { ReactNode } from "react";

const { Title } = Typography;

interface PageContainerProps {
  title?: string;
  children: ReactNode;
}

const PageContainer = ({ title, children }: PageContainerProps) => {
  return (
    <div>
      {title && (
        <Title level={3} style={{ marginBottom: "1rem" }}>
          {title}
        </Title>
      )}
      <div>{children}</div>
    </div>
  );
};

export default PageContainer;
