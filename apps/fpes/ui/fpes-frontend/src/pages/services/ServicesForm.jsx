import { FormControl, TextField, Button, MenuItem, Box, Grid} from "@mui/material";
import { useForm } from "react-hook-form"

import axios from "axios";

export default function ServicesForm({setServices, defaultValues, isUpdate}) {
    const {register, handleSubmit, reset, formState:{errors}} = useForm({defaultValues : isUpdate ? defaultValues : 
        {
            title : "",
            hours_worked : "",
            form_id : "",
            service_type : "internal",
            other_contributions : ""
        }
    });

    const addService = (data) => {
        axios.post("http://localhost:3000/services", data)
        .then((res) => {
            var newService = data;
            newService.id = res.data[0].id;
            setServices(prevServices => [...prevServices, newService]);
        });
    }

    return (
        <Box sx={{ height: 400, width: '50%', display:"inline-block"}}>
        <h3>Create Service</h3>
        <form onSubmit={handleSubmit((data) => {console.log(data); addService(data); reset();})}>
            <Grid container spacing={2}>
            <Grid size={6}>
            <TextField 
            {...register("title", {required: {value: true, message:"Service Title is required"}, maxLength: {value:255, message:"Serivce Title cannot be longer than 255 characters."}})}
            label="Title" 
            error={errors.title} 
            helperText={errors.title?.message} 
            placeholder="Service Title" 
            sx={{width:"80%"}}
            />
            </Grid>
            <Grid size={6}>
            <TextField 
            {...register("hours_worked", {
                required: {value: true, message:"Hours Worked is required"}, 
                min: {value : 5, message : "Must be greater than 5 hours worked"}, 
                valueAsNumber: {value:true, message:"Must be a number"}
                })
            } 
            label="Hours Worked" 
            error={errors.hours_worked} 
            helperText={errors.hours_worked?.message} 
            placeholder="Hours Worked"
            sx={{width:"80%"}}
            />
            </Grid>
            <Grid size={6}>
            <TextField 
            {...register("form_id", {
                required:{value : true, message : "Form ID is required"}, 
                min: {value : 1, message : "Must be >= 1"}, 
                valueAsNumber:true,
                pattern: {
                    value: /^[0-9]+$/,
                    message: 'Please enter a number',
                }
            })
            }
            label="Form ID" 
            error={errors.form_id} 
            helperText={errors.form_id?.message} 
            placeholder="Form ID"
            sx={{width:"80%"}}
            />
            </Grid>

            <Grid size={6}>
                <TextField sx={{width:"80%"}} {...register("service_type")} select defaultValue={"internal"}>
                    <MenuItem value="internal">Internal</MenuItem>
                    <MenuItem value="external">External</MenuItem>
                </TextField>
                </Grid>

            

            <Grid item sx={{justifySelf:"left"}} size={6}>
            <TextField sx={{width:"80%"}} {...register("other_contributions")} label="Other Comments" placeholder="Other Comments" multiline minRows={4} maxRows={10}/>
            </Grid>
            <Grid size={6}/>

            <Grid item  size={4}>
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
