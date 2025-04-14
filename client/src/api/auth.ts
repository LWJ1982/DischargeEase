// src/api/auth.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;


export const register = async (data: any) => {
  return axios.post(`${BASE_URL}/user/register`, data);
};

export const login = async (data: any) => {
  return axios.post(`${BASE_URL}/user/login`, data);
};
