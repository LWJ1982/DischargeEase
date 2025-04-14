// src/components/common/GlobalLoader.tsx
import { Spin } from "antd";

const GlobalLoader = () => {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Spin size="large" tip="Loading..." />
    </div>
  );
};

export default GlobalLoader;
