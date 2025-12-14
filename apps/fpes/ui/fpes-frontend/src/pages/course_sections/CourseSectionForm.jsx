import React, { useEffect, useState } from "react"
import { FormGroup, FormControl, Input, Select, TextField, Button, MenuItem, Alert, Modal, Box, Typography, Grid, Paper, IconButton, Icon, Autocomplete, FormControlLabel, InputLabel, FormHelperText, filledInputClasses, Checkbox} from "@mui/material";
import { Controller } from "react-hook-form";
import CloseIcon from '@mui/icons-material/Close';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";


export default function CourseSectionForm({courses, control, section, handleRemoveSection, handleDuplicateSection, index, errors}){
    // Handles Menu Item of (M,W,F) and (T,TH) presets for days of the week selection
    const handlePresetClick = (e, preset, field) => {
        e.preventDefault();
        e.stopPropagation();
        const current = field.value || [];
        const allSelected = preset.every(day => current.includes(day));
        field.onChange(allSelected ? current.filter(d => !preset.includes(d)) : [...new Set([...current, ...preset])]);
    };

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
                    name={section + "section_id"}
                    rules={
                        {
                            required:{value:true, message:"Section ID is required"},
                            min : {value : 0, message:"Section ID must be > 0"},
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
                        sx={{width:"100%"}}
                        label="Section ID"
                        error={errors.course_sections?.[index]?.section_id} 
                        helperText={errors.course_sections?.[index]?.section_id?.message}
                        />
                    }
                />
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

                        // Mapping of days is needed for the ability to select multiple days from one MenuItem
                        renderValue={(selected) => {
                            const dayMap = { "1": "Mon.", "2": "Tue.", "3": "Wed.", "4": "Thu.", "5": "Fri." };
                            return selected.sort((a, b) => a - b).map(day => dayMap[day]).join(", ");
                        }}
                        >
                            <MenuItem value="MWF" onMouseDown={(e) => handlePresetClick(e, ["1", "3", "5"], field)} sx={{ fontWeight: 'bold', borderBottom: '1px solid #e0e0e0' }}>
                                Mon. Wed. Fri.
                            </MenuItem>
                            <MenuItem value="TTH" onMouseDown={(e) => handlePresetClick(e, ["2", "4"], field)} sx={{ fontWeight: 'bold', borderBottom: '1px solid #e0e0e0', mb: 1 }}>
                                Tue. Thu.
                            </MenuItem> 
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
                    name={section + "year"}
                    rules={{required:"Year is required"}}
                    render={({field}) =>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                        {...field} 
                        defaultValue={dayjs('2024')}
                        views={["year"]}
                        sx={{width:"100%"}}
                        label="Year"
                        slotProps={{
                            textField: {
                                helperText: errors.course_sections?.[index]?.year?.message,
                                error: errors.course_sections?.[index]?.year
                            }
                        }}
                        />
                        </LocalizationProvider>
                    }
                />
            </Grid>

            <Grid size={6}>
                <Controller 
                    control={control}
                    name={section + "number_of_students"}
                    rules={
                        {
                            required:{value:true, message:"Number of Students is required"},
                            min : {value : 0, message:"Number of Students must be > 0"},
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
                        sx={{width:"100%"}}
                        label="Number of Students"
                        error={errors.course_sections?.[index]?.number_of_students} 
                        helperText={errors.course_sections?.[index]?.number_of_students?.message}
                        />
                    }
                />
            </Grid>

            <Grid size={6}>
                <Controller 
                    control={control}
                    name={section + "taught_for_first_time"}
                    render={({field}) =>
                    <FormControlLabel control={<Checkbox {...field}/>} label="Taught For First Time"/>
                    }
                />
            </Grid>

            
        </Grid>
    )
}