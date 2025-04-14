// src/components/AssignedServiceCard.tsx
import { useState } from "react";
import { Card, Tag, Space, Typography } from "antd";
import dayjs from "dayjs";
import ServiceStatusUpdater from "./ServiceStatusUpdater";

const { Text, Title } = Typography;

interface AssignedServiceCardProps {
  booking: {
    id: number;
    patient_name: string;
    status: string;
    schedule_time: string;
    Service: {
      service_name: string;
      description: string;
    };
    patient?: {
      ward?: string;
    };
  };
}

const statusColors: Record<string, string> = {
  pending: "orange",
  scheduled: "blue",
  "in progress": "purple",
  completed: "green",
  cancelled: "red",
};

const AssignedServiceCard = ({ booking }: AssignedServiceCardProps) => {
  const [status, setStatus] = useState(booking.status);

  return (
    <Card style={{ marginBottom: 16 }}>
      <Space direction="vertical">
        <Title level={4}>{booking.Service.service_name}</Title>
        <Text type="secondary">{booking.Service.description}</Text>
        <Text>
          🧍 Patient: <strong>{booking.patient_name}</strong>
        </Text>
        <Text>
          🏥 Ward: <strong>{booking.patient?.ward || "N/A"}</strong>
        </Text>
        <Text>
          ⏰ Time:
          <strong>
            {dayjs(booking.schedule_time).format("MMMM D, YYYY h:mm A")}
          </strong>
        </Text>
        <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>

        {/* ✅ status update dropdown */}
        <ServiceStatusUpdater
          bookingId={booking.id}
          currentStatus={status}
          onStatusChange={setStatus}
        />
      </Space>
    </Card>
  );
};

export default AssignedServiceCard;
