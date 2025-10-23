import { useEffect, useState } from "react";
import { FormGroup, FormControl, Input, Select, TextField, Button, MenuItem, Alert, Modal, Box, Typography, Grid, Paper} from "@mui/material";
import ServiceForm from "./ServiceForm";
import { useForm } from "react-hook-form";

export default function ServicesFormStep(){
    const basic_service = {
        title : "",
        hours_worked : "",
        form_id : "",
        service_type : "internal",
        other_contributions : ""
    }
    
    const {control, handleSubmit, reset, formState:{errors}} = useForm({defaultValues :
        {
            services : [
                {
                    title : "",
                    hours_worked : "",
                    form_id : "",
                    service_type : "internal",
                    other_contributions : ""
                },
            ]
        }
    });

    return (
        services.map((service, index) => (<ServiceForm key={index} control={control} register_service={"services[0]"}/>))
    )



}