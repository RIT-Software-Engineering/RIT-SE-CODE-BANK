import { FormControl, TextField, Button, Grid, Box} from "@mui/material";
import { useForm } from "react-hook-form"


export default function DepartmentsForm({defaultValues, isUpdate, onSubmit}) {
    const {register, handleSubmit, reset, formState:{errors}} = useForm({defaultValues : isUpdate ? defaultValues : 
        {
            department_name:"",
            college: ""
        }
    });

    return (
        <Box sx={{ height: 400, display:"inline-block"}}>
        <h3>Create Department</h3>
        <form onSubmit={handleSubmit((data) => {console.log(data); onSubmit(data); reset()})}>
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
            <Button variant="outlined" onClick={() => reset()}>
                {isUpdate ? "Reset" : "Clear"}
            </Button>
            </Grid>
            <Grid size={4}/>
            <Grid item  size={4}>
            <Button variant="contained" type="submit">{isUpdate ? "Update" : "Submit"}</Button>
            </Grid>
        </Grid>
        </form>
        </Box>
    );
}
