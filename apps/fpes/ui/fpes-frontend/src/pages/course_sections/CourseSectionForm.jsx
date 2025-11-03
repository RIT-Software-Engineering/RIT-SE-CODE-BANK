import React, { useEffect, useState } from "react"
import { FormGroup, FormControl, Input, Select, TextField, Button, MenuItem, Alert, Modal, Box, Typography, Grid, Paper, IconButton, Icon, Autocomplete, FormLabel, InputLabel, FormHelperText, filledInputClasses} from "@mui/material";
import { Controller } from "react-hook-form";
import CloseIcon from '@mui/icons-material/Close';


export default function CourseSectionForm({courses, control, section, handleRemoveSection, index, errors}){
    return (
        <Grid container spacing={2} columnSpacing={8}>
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
                    sx={{width:"100%"}}
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
                        <FormControl sx={{width:"100%"}}>
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
                        sx={{width:"100%"}}
                        label="Location"
                        error={errors.course_sections?.[index]?.room_location} 
                        helperText={errors.course_sections?.[index]?.room_location?.message}
                        />
                    }
                />
            </Grid>
            <Grid size={6}>
                <Controller
                    name={section + "semester"}
                    control={control}
                    rules={{required:"Semester is required"}}
                    render={({field}) => 
                        <FormControl sx={{width:"100%"}} >
                        <InputLabel error={errors.course_sections?.[index]?.semester}id="semester_label">Semester</InputLabel>
                        <Select 
                        {...field} 
                        labelId="semester_label" 
                        label="Semester"
                        error={errors.course_sections?.[index]?.semester} 
                        >
                            <MenuItem value="FALL">Fall</MenuItem>
                            <MenuItem value="SPRING">Spring</MenuItem>
                            <MenuItem value="SUMMER">Summer</MenuItem>
                        </Select>
                        <FormHelperText error={errors.course_sections?.[index]?.semester}>{errors.course_sections?.[index]?.semester?.message}</FormHelperText>
                        </FormControl>
                    }
                />
            </Grid>
            <Grid size={6}>
                <Controller
                    control={control}
                    name={section + "scholastic_year"}
                    rules={{required:"Year is required"}}
                    render={({field}) =>
                        <TextField
                        {...field} 
                        sx={{width:"100%"}}
                        label="Scholastic Year"
                        error={errors.course_sections?.[index]?.scholastic_year} 
                        helperText={errors.course_sections?.[index]?.scholastic_year?.message}
                        />
                    }
                />
            </Grid>

            <Grid size={6}>
                <Controller 
                    control={control}
                    name={section + "number_of_students"}
                    rules={{required:{value:true, message:"Students is required"}}}
                    render={({field}) =>
                    <TextField 
                        {...field}
                        sx={{width:"100%"}}
                        label="Number of Students"
                        error={errors.course_sections?.[index]?.number_of_students} 
                        helperText={errors.course_sections?.[index]?.number_of_students?.message}
                        />
                    }
                />
            </Grid>
        </Grid>
    )
}