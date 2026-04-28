import axios from "axios";
import { auth } from "@/firebaseConfig";
import Constants from "expo-constants";

// Get the machine's IP address dynamically to handle Android Emulator and physical devices
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(":").shift() || "localhost";

// For Android emulator 10.0.2.2 is usually the mapping to localhost
// For iOS and physical devices, the actual machine IP is better
const BASE_URL = __DEV__
  ? `http://${localhost}:3000`
  : "https://clinic-backend-1-85ld.onrender.com";

console.log("API BASE_URL:", BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
