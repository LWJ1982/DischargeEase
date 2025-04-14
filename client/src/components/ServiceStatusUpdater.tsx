// src/components/ServiceStatusUpdater.tsx
import { Select, message } from "antd";
import { updateBookingStatus } from "../api/serviceBooking";
import { useState } from "react";

const { Option } = Select;

interface Props {
  bookingId: number;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
}

const statusOptions = [
  "pending",
  "scheduled",
  "in progress",
  "completed",
  "cancelled",
];

const statusColors: Record<string, string> = {
  pending: "orange",
  scheduled: "blue",
  "in progress": "purple",
  completed: "green",
  cancelled: "red",
};

const ServiceStatusUpdater = ({
  bookingId,
  currentStatus,
  onStatusChange,
}: Props) => {
  const [loading, setLoading] = useState(false);

  const handleChange = async (value: string) => {
    setLoading(true);
    try {
      await updateBookingStatus(bookingId, value);
      onStatusChange(value);
      message.success(`Status updated to ${value}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      message.error("Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      value={currentStatus}
      onChange={handleChange}
      loading={loading}
      style={{ width: 200 }}
    >
      {statusOptions.map((status) => (
        <Option key={status} value={status}>
          <span style={{ color: statusColors[status] }}>
            {status.toUpperCase()}
          </span>
        </Option>
      ))}
    </Select>
  );
};

export default ServiceStatusUpdater;
