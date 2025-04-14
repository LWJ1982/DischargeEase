// src/contexts/AuthContext.tsx

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  mobile?: string;
  profilePicture?: string;
  // any other fields
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Apply token globally to axios
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // We attempt to retrieve the user from /api/v1/user/auth
      axios
        .get(`${BASE_URL}/user/auth`)
        .then((res) => {
          // console.log("Auth endpoint response:", res.data.user);
          setUser(res.data.user);
        })
        .catch((err) => {
          console.error("Auth check failed:", err);
          logout(); // if something fails (token invalid), log out
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken: string, userData: AuthUser) => {
    localStorage.setItem("token", newToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
