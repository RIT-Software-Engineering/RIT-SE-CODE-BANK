import { useEffect, useState } from "react";
import { FormGroup, FormControl, Input, Select, TextField, Button, MenuItem, Alert, Modal, Box, Typography, Grid, Paper, IconButton, Icon} from "@mui/material";
import { Controller } from "react-hook-form";
import CloseIcon from '@mui/icons-material/Close';


export default function ServiceForm({control, register_service, handleRemoveService, index, errors}){
    return (
        <Grid container spacing={2} columnSpacing={8}>
            <Grid item size={10}>
                <Typography variant="h5" textAlign="left">New Service</Typography>
            </Grid>

            <Grid item size={2}>
                <IconButton onClick={() => handleRemoveService(index)}>
                    <CloseIcon/>
                </IconButton>
            </Grid>

            <Grid item size={6}>
                <Controller
                    name={register_service + "title"}
                    control={control}
                    rules={
                        {
                            required : {value: true, message:"Title is required"}, 
                            maxLength: {value : 255, message:"Title cannot be longer than 255 characters"}
                        }
                    }

                    render={({field}) => 
                    <TextField {...field}
                    label="Title"
                    error={errors.services?.[index]?.title} 
                    helperText={errors.services?.[index]?.title?.message} 
                    placeholder="Service Title" 
                    sx={{width:"100%"}}
                    />
                    }
                />
            </Grid>

            <Grid item size={6}>
                <Controller
                    name={register_service + "hours_worked"}
                    control={control}
                    rules={
                        {
                            required : "Hours Worked is required",
                            min : {value : 5, message:"Hours Worked must be >= 5"},
                            pattern: {
                                value: /^[0-9]+$/i,
                                message: 'Must only contain numbers',
                            },
                            valueAsNumber : true
                        }
                    }
                    render={({field}) =>
                        <TextField
                            {...field}
                            label="Hours Worked" 
                            error={errors.services?.[index]?.hours_worked} 
                            helperText={errors.services?.[index]?.hours_worked?.message} 
                            placeholder="Hours Worked"
                            sx={{width:"100%"}}
                        />
                    }
                />
            </Grid>
        
            <Grid item size={6}>
                <Controller
                    name={register_service + "service_type"}
                    control={control}
                    rules={{required:"Service Type is required"}}
                    render={({field}) => 
                        <TextField 
                        {...field}
                        sx={{width:"100%"}}  
                        select 
                        label="Service Type"
                        error={errors.services?.[index]?.service_type} 
                        helperText={errors.services?.[index]?.service_type?.message} 
                        >
                            <MenuItem value="internal">Internal</MenuItem>
                            <MenuItem value="external">External</MenuItem>
                        </TextField>
                    }
                />
            </Grid>

            <Grid item size={10}>
                <Controller
                    name={register_service + "other_contributions"}
                    control={control}
                    render={({field}) =>
                        <TextField 
                        sx={{width:"100%"}} 
                        {...field} 
                        label="Other Contributions" 
                        placeholder="Other Contributions" 
                        multiline minRows={4} 
                        maxRows={10}
                        />
                    }
                />
            </Grid>

        </Grid>
    )
}