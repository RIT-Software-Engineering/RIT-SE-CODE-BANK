import axios from "axios";

const API_URL = "http://localhost:3000/courses";

export const getCourses = () => axios.get(API_URL);
export const createCourse = (course) => axios.post(API_URL, course);
export const deleteCourse = (id) => axios.delete(`${API_URL}/${id}`);
export const getDepartments = () => axios.get("http://localhost:3000/departments");
