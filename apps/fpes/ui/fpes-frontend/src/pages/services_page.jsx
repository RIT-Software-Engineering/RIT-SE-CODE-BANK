import { useState, useEffect } from "react";
import ServicesForm from "./ServiceForm";
import ServicesTable from "./ServicesTable";
import { getServices } from '../api/services_api_imports';

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
            <ServicesTable services={services} setServices={setServices}/>
            <ServicesForm services={services} setServices={setServices}/>
        </div>
    );
}