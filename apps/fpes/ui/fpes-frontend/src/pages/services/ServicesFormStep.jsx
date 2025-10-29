import { useEffect, useState } from "react";
import { FormGroup, FormControl, Input, Select, TextField, Button, MenuItem, Alert, Modal, Box, Typography, Grid, Paper} from "@mui/material";
import ServiceForm from "./ServiceForm";
import { useFieldArray } from "react-hook-form";

export default function ServicesFormStep({form_id, control, errors, handle}){
    const [number_of_services, setNumberOfServices] = useState(0);

    function Service(form_id){
        this.title = "";
        this.hours_worked = "";
        this.form_id = "";
        this.service_type = "";
        this.other_contributions = "";
        this.form_id = form_id;
    }

    const {fields, append, remove} = useFieldArray(
        {
            control,
            name : "services"
        }
    )

    function removeService(index) {
        remove(index);
        setNumberOfServices(prev => prev - 1);
    }

    return (
        <div>
        <Grid container rowSpacing={0} columns={12}>
        {fields.map((service, index) => 
        (
            <Paper sx={{padding:"4% 4%", marginTop:"4%", width:"600px"
            }}>
                <ServiceForm
                key={service.id} 
                control={control} 
                register_service={`services[${index}].`} 
                errors={errors} 
                index={index}
                handleRemoveService={removeService}
                />
            </Paper>
        ))}
        </Grid>
        <Button onClick={() => {append(new Service(form_id)); setNumberOfServices(number_of_services + 1)}}>Add Service</Button>
        </div>
    )



}