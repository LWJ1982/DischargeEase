// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { Spin, Typography } from "antd";
import { getProfile } from "../api/profile";
import { useAuth } from "../contexts/AuthContext";
import ProfileCard from "../components/ProfileCard";

const { Text } = Typography;

interface UserProfile {
  id: number;
  name: string;
  email: string;
  mobileNumber?: string;
  profilePicture?: string;
}

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      getProfile()
        .then((res) => setProfile(res.data.user))
        .catch(() => setProfile(null))
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (loading)
    return (
      <Spin
        style={{ display: "flex", justifyContent: "center", marginTop: "20%" }}
      />
    );
  if (!profile) return <Text type="danger">Failed to load profile.</Text>;

  return (
    <div
      style={{ display: "flex", justifyContent: "center", paddingTop: "10vh" }}
    >
      <ProfileCard {...profile} />
    </div>
  );
};

export default Profile;
