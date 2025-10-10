import axios from 'axios';

export const getServices = async () => {
    return axios.get("http://localhost:3000/services");
}