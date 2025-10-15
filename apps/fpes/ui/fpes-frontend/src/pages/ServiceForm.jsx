import React from "react";
import { FormGroup, FormControl, Input, Select, TextField, Button, MenuItem } from "@mui/material";
import { useForm} from "react-hook-form"
import "../style/ServiceForm.css";

export default function ServicesForm(defaultValues, isUpdate) {
    const {register, handleSubmit} = useForm();

    return (
        <form onSubmit={handleSubmit((data => console.log(data)))}>
            <div>
            <TextField {...register("title")} label="Title" placeholder="Service Title" />
            <TextField {...register("hours_worked")} type="number" label="Hours Worked" min={5} max={999} placeholder="Hours Worked"/>
            </div>
            <div>
            <Select {...register("service_type")} label="Service Type" defaultValue={"internal"}>
                <MenuItem value="internal">Internal</MenuItem>
                <MenuItem value="external">External</MenuItem>
            </Select>
            </div>
            <Button variant="contained" type="submit">Submit</Button>
        </form>
    
    );
}
