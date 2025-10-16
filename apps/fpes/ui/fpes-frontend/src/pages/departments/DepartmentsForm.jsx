import { useEffect, useState } from "react";
import { FormGroup, FormControl, Input, Select, TextField, Button, MenuItem, Alert, Modal, Box, Typography, Grid, Paper} from "@mui/material";
import { useForm } from "react-hook-form"

import axios from "axios";

const modal_box_style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

const text_field_style = {
    left: '0%'
}

export default function DepartmentsForm({departments, setDepartments, defaultValues, isUpdate}) {
    const {register, handleSubmit, reset, formState:{errors}} = useForm();

    const [addModalOpen, setAddModalOpen] = useState(false);

    const addDepartment = (data) => {
        axios.post("http://localhost:3000/departments", data)
        .then((res) => {
            var newDepartment = data;
            newDepartment.id = res.data[0].id;
            setDepartments(prevDepartments => [...prevDepartments, newDepartment]);
        });
    }

    return (
        <Box sx={{ height: 400, width: '50%', display:"inline-block"}}>
        <h3>Create Department</h3>
        <form onSubmit={handleSubmit((data) => {console.log(data); addDepartment(data); reset()})}>
            <Grid container spacing={2}>
            <Grid size={6}>
            <TextField 
            {...register("department_name", {required: {value: true, message:"Department Name is required"}, maxLength: {value:50, message:"Department Name cannot be longer than 50 characters"}})}
            label="Department Name" 
            error={errors.department_name} 
            helperText={errors.department_name?.message} 
            placeholder="Department" 
            />
            </Grid>
            <Grid size={6}>
            <TextField 
            {...register("college", {required: {value: true, message:"College is required"}, maxLength: {value: 50, message:"College name cannot be longer than 50 characters"}})}  
            label="College" 
            error={errors.college} 
            helperText={errors.college?.message} 
            placeholder="College"
            />
            </Grid>

            <Grid item size={4}>
            <Button variant="outlined" type="reset">Clear</Button>
            </Grid>
            <Grid size={4}/>
            <Grid item  size={4}>
            <Button variant="contained" type="submit">Submit</Button>
            </Grid>
        </Grid>
        </form>
        </Box>
    );
}
