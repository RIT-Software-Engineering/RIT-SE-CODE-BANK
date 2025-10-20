import axios from "axios";

const API_URL = "http://localhost:3000/grants";

export const getGrants = async () => {
  return axios.get(API_URL);
};

export const createGrant = async (grant) => {
  return axios.post(API_URL, grant);
};