import { useState, useEffect } from "react";
import ServicesForm from "./ServicesForm.jsx";
import ServicesTable from "./ServicesTable";
import { getServices } from '../../api/services_api_imports.js';
import ServicesFormStep from "./ServicesFormStep.jsx";

export default function ServicesPage() {
    const [services, setServices] = useState([]);

    useEffect(() => {
        getServices()
        .then((response) => {
            setServices(response.data);
        })
    }, []);
    return(
        <div>
            <h2>Services Page</h2>
            <ServicesTable services={services} setServices={setServices}/>
            <ServicesForm/>
        </div>
    );
}