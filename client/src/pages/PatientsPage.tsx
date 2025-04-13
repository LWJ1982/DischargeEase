// src/pages/PatientsPage.tsx
import { useEffect, useState } from "react";
import { List, Card, Typography, Spin } from "antd";
import { getAllPatientRecords, PatientRecord } from "../api/medicalRecords";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

const PatientsPage = () => {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await getAllPatientRecords();
        setRecords(data);
      } catch (error) {
        console.error("Failed to fetch patient records", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  if (loading)
    return <Spin size="large" style={{ display: "block", marginTop: 100 }} />;

  return (
    <div style={{ padding: "24px" }}>
      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={records}
        renderItem={(record) => (
          <List.Item key={record.id}>
            <Card
              title={record.name}
              hoverable
              onClick={() => navigate(`/patients/${record.id}`)}
              style={{ cursor: "pointer" }}
            >
              <Text strong>Email: </Text>
              {record.patient?.email || "N/A"}
              <br />
              <Text strong>Ward: </Text>
              {record.ward || "N/A"}
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

export default PatientsPage;
