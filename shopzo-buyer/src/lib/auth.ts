import axios from "axios";
import { API_ENDPOINTS } from "./api";
export const getCurrentUser = async () => {
  console.log("fetching user");

  const res = await axios.get(`${API_ENDPOINTS.CURRENT_USER}`, {
    withCredentials: true,
  });
  return res.data;
};
