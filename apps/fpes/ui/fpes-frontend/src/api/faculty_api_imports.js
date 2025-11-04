import axios from "axios";

const API_URL = "http://localhost:3000/faculty";

export const getAllFaculty = () => axios.get(API_URL);
export const getFacultyById = (id) => axios.get(`${API_URL}/${id}`);
export const updateFaculty = (id, data) => axios.put(`${API_URL}/${id}`, data);