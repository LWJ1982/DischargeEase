// src/api/profile.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getProfile = async () => {
  return axios.get(`${BASE_URL}/profile`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};
