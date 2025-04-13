// src/pages/PatientDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Typography, Card, Divider, Image, List, Spin, Alert } from "antd";
import {
  getPatientRecordById,
  getErrataForPatient,
  PatientRecord,
  Erratum,
} from "../api/medicalRecords";

const { Title, Paragraph, Text } = Typography;

const PatientDetailPage = () => {
  const { id } = useParams();
  const [record, setRecord] = useState<PatientRecord | null>(null);
  const [errata, setErrata] = useState<Erratum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const recordData = await getPatientRecordById(Number(id));
        const errataData = await getErrataForPatient(Number(id));
        setRecord(recordData);
        setErrata(errataData);
      } catch (error) {
        console.error("Error loading patient details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading)
    return <Spin size="large" style={{ display: "block", marginTop: 100 }} />;

  if (!record)
    return <Alert message="Patient record not found." type="error" showIcon />;

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Patient: {record.name}</Title>

      <Card bordered style={{ marginBottom: "24px" }}>
        <Paragraph>
          <Text strong>Ward: </Text> {record.ward || "N/A"}
        </Paragraph>
        <Paragraph>
          <Text strong>Medical History:</Text>
          <br />
          {record.medical_history || "No medical history provided."}
        </Paragraph>

        {record.drawings && record.drawings.length > 0 && (
          <>
            <Divider>Drawings</Divider>
            <Image.PreviewGroup>
              {record.drawings.map((url, index) => (
                <Image
                  key={index}
                  src={url}
                  width={120}
                  style={{ marginRight: "12px", marginBottom: "12px" }}
                />
              ))}
            </Image.PreviewGroup>
          </>
        )}
      </Card>

      <Divider orientation="left">Erratum Submissions</Divider>
      <List
        dataSource={errata}
        locale={{ emptyText: "No erratum submissions for this record." }}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={`By ${item.SubmittedBy.name} (${
                item.SubmittedBy.role
              }) on ${new Date(item.timestamp).toLocaleString()}`}
              description={item.correction_details}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default PatientDetailPage;
