import { useState, useEffect } from "react";
import ServicesForm from "./ServicesForm.jsx";
import ServicesTable from "./ServicesTable";
import { getServices } from '../../api/services_api_imports.js';

export default function ServicesPage() {
    const [services, setServices] = useState([]);

    const getAllServices = () => {
        useEffect(() => {
            getServices()
            .then((response) => {
                setServices(response.data);
            })
        }, []);
    }

    getAllServices();
    return(
        <div>
            <h2>Services Page</h2>
            <ServicesTable services={services} setServices={setServices}/>
            <ServicesForm services={services} setServices={setServices}/>
        </div>
    );
}