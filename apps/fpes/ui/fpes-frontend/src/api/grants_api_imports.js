import axios from "axios";

const API_URL = "http://localhost:5173/grants";

export const getGrants = async () => {
  return axios.get(API_URL);
};

export const createGrant = async (grant) => {
  return axios.post(API_URL, grant);
};