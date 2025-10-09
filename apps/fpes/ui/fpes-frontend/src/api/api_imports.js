import axios from "axios";

const API_URL = "http://localhost:5173/api/grants";

export const getGrants = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createGrant = async (grant) => {
  const res = await axios.post(API_URL, grant);
  return res.data;
};