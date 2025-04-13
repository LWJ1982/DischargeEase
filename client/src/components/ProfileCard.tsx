// src/components/ProfileCard.tsx
import { Avatar, Card, Typography } from "antd";

const { Title, Text } = Typography;

export interface ProfileCardProps {
  name: string;
  email: string;
  mobileNumber?: string;
  profilePicture?: string;
}

const ProfileCard = ({
  name,
  email,
  mobileNumber,
  profilePicture,
}: ProfileCardProps) => {
  return (
    <Card style={{ width: 400 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar size={100} src={profilePicture} />
        <Title level={3} style={{ marginTop: 16 }}>
          {name}
        </Title>
        <Text strong>Email:</Text>
        <Text>{email}</Text>
        <Text strong>Mobile:</Text>
        <Text>{mobileNumber || "Not provided"}</Text>
      </div>
    </Card>
  );
};

export default ProfileCard;
