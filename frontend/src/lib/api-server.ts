import axios from "axios";
import { auth } from "@/auth";

const API_URL = process.env.API_URL;


export async function getApiServer() {
  const session = await auth();

  const instance = axios.create({
    baseURL: `${API_URL}/api`,
  });

  instance.interceptors.request.use((config) => {
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  });

  return instance;
}
