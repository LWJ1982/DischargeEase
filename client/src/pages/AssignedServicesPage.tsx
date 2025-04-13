// src/pages/AssignedServicesPage.tsx
import { useEffect, useState } from "react";
import { Spin, Alert, Typography, Empty } from "antd";
import { getNurseAssignments } from "../api/serviceBooking";
import { useAuth } from "../contexts/AuthContext";
import AssignedServiceCard from "../components/AssignedServiceCard";

const { Title } = Typography;

const AssignedServicesPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      try {
        const data = await getNurseAssignments(user.id);
        setBookings(data);
      } catch (err: any) {
        console.error("Failed to load bookings:", err);
        setError("Failed to load service assignments.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  if (loading) return <Spin tip="Loading your assigned services..." />;
  if (error) return <Alert type="error" message={error} showIcon />;
  if (!loading && bookings.length === 0) {
    return (
      <div
        style={{ padding: "2rem", display: "flex", justifyContent: "center" }}
      >
        <Empty
          description="No assigned services at the moment."
          imageStyle={{ height: 160 }}
        />
      </div>
    );
  }

  return (
    <div>
      {bookings.map((booking: any) => (
        <AssignedServiceCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
};

export default AssignedServicesPage;
