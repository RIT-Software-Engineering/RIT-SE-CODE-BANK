import React, { useEffect, useState } from "react"
import { FormGroup, FormControl, Input, Select, TextField, Button, MenuItem, Alert, Modal, Box, Typography, Grid, Paper, IconButton, Icon, Autocomplete, FormLabel, InputLabel, FormHelperText} from "@mui/material";
import { Controller } from "react-hook-form";
import CloseIcon from '@mui/icons-material/Close';


export default function CourseSectionForm({courses, control, section, handleRemoveSection, index, errors}){
    return (
        <Grid container spacing={2} columnSpacing={2}>
            <Grid item size={10}>
                <Typography variant="h5" textAlign="left">New Section</Typography>
            </Grid>

            <Grid item size={2}>
                <IconButton onClick={() => handleRemoveSection(index)}>
                    <CloseIcon/>
                </IconButton>
            </Grid>

            <Grid item size={6}>
                <Controller
                control={control}
                name={section + "course"}
                rules={
                    {
                        required : "Course is required",
                        valueAsNumber : true
                    }
                }
                render={({field}) => <Autocomplete
                    sx={{width:"80%"}}
                    {...field}
                    disablePortal
                    options={courses}
                    error={errors.course}
                    getOptionLabel={(option) => option.label}
                    renderInput={(params) => 
                    <TextField 
                    {...params} error={errors.course_sections?.[index]?.course} helperText={errors.course_sections?.[index]?.course?.message} label="Course" />
                    }
                    onChange={(e,data) => field.onChange(data)}
                />
                }/>
            </Grid>

            <Grid size={6}>
                <Controller
                    control={control}
                    name={section + "days_of_the_week"}
                    rules={
                        {
                            required : "Class Days are required"
                        }
                    }
                    render={({field}) =>
                        <FormControl sx={{width:"80%"}}>
                        <InputLabel error={errors.course_sections?.[index]?.days_of_the_week} id="days_of_the_week">Class Days</InputLabel>
                        <Select
                        {...field}
                        label="Class Days" 
                        labelId="days_of_the_week"
                        multiple 
                        defaultValue={[]}
                        error={errors.course_sections?.[index]?.days_of_the_week}
                        helperText={errors.course_sections?.[index]?.days_of_the_week?.message}
                        >
                            <MenuItem value="1">Mon.</MenuItem>
                            <MenuItem value="2">Tue.</MenuItem>
                            <MenuItem value="3">Wed.</MenuItem>
                            <MenuItem value="4">Thu.</MenuItem>
                            <MenuItem value="5">Fri.</MenuItem>
                        </Select>
                        <FormHelperText error={errors.course_sections?.[index]?.days_of_the_week}>{errors.course_sections?.[index]?.days_of_the_week?.message}</FormHelperText>
                        </FormControl>
                    }
                />
            </Grid>

            <Grid size={6}>
                <Controller
                    name={section + "room_location"}
                    control={control}
                    rules={
                        {required : "Room is required"}
                    }
                    render={({field}) => 
                        <TextField
                        {...field}
                        sx={{width:"80%"}}
                        label="Location"
                        error={errors.course_sections?.[index]?.room_location} 
                        helperText={errors.course_sections?.[index]?.room_location?.message}
                        />
                    }
                />
            </Grid>
            <Grid size={6}>
                
            </Grid>

        </Grid>
    )
}