import { useEffect, useState } from "react";
import { FormGroup, FormControl, Input, Select, TextField, Button, MenuItem, Alert, Modal, Box, Typography, Grid, Paper} from "@mui/material";
import ServiceForm from "./ServiceForm";
import { useFieldArray, useForm } from "react-hook-form";

export default function ServicesFormStep({form_id}){
    const [number_of_services, setNumberOfServices] = useState(0);

    function Service(form_id){
        this.title = "";
        this.hours_worked = "";
        this.form_id = "";
        this.service_type = "";
        this.other_contributions = "";
        this.form_id = form_id;
    }

    const {control, handleSubmit, reset, formState:{errors}} = useForm({defaultValues :
        {
            services : []
        },
        mode:"onChange"
    });

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
        <form onSubmit={handleSubmit((data) => console.log(data))}>
        <Grid container rowSpacing={0} columns={12}>
        {fields.map((service, index) => 
        (
            <>
            <Grid item size={2}/>
            <Grid item size={8}>
                <Paper sx={{padding:"4% 4%", marginTop:"4%", width:"100%"
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
            </Grid>
            <Grid item size={2}/>
            </>
            
        ))}
        </Grid>
        <Button type="submit">Submit</Button>
        <Button onClick={() => {append(new Service(form_id)); setNumberOfServices(number_of_services + 1)}}>Add Service</Button>
        </form>
        </div>
    )



}