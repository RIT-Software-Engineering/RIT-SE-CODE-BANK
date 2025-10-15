import ServicesForm from "./ServiceForm";
import ServicesTable from "./ServicesTable";
import React from "react";

export default function ServicesPage() {
    return(
        <div>
            <ServicesTable/>
            <ServicesForm/>
        </div>
    );
}