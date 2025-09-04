"use client";

import axios from "axios";
import { getSession } from "next-auth/react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_REMOTE;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
});

apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

export default apiClient;
