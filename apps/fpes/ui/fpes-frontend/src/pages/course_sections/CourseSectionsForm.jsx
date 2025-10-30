import { useEffect, useState } from "react";
import { Select, TextField, Button, MenuItem, Box, Grid, Paper, Autocomplete, Radio, InputLabel, FormControl, FormHelperText} from "@mui/material";
import { Form, useForm } from "react-hook-form"

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

export default function CourseSectionsForm({setCourseSections, courses}){
    const {register, handleSubmit, reset, formState:{errors}} = useForm();

    function createCourseIDDictionary(courses){
        const course_ids = new Map();
        courses.forEach(course => {
            course_ids.set(course.course_code, course.id);
        });
        return course_ids;
    }

    const course_ids = createCourseIDDictionary(courses);

    console.log(course_ids);

    function getDayOfTheWeekValues(preTransformed){
        preTransformed.sort();
        const DAYS_OF_THE_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        var classDays = [];
        preTransformed.forEach(value => {
            classDays.push(DAYS_OF_THE_WEEK[value - 1]);
        });
        classDays = classDays.join("/");
        return classDays;
    }

    function onFormSubmit(data){
        
        var transformedData = {...data}
        transformedData.days_of_the_week = getDayOfTheWeekValues(data.days_of_the_week);
        transformedData.course_id = course_ids.get(transformedData.course);
        transformedData.course_code = transformedData.course;
        delete transformedData.course;
        console.log(transformedData);
        axios.post("http://localhost:3000/course_sections", transformedData)
        .then((res) => {
            transformedData.id = res.data[0].id;
            setCourseSections((prevSections) => [...prevSections,transformedData])
        });
    }

    return (
        <Box sx={{height:400, width:600, display:"inline-block"}}>
            <h3>Add Course Section</h3>
            <form onSubmit={handleSubmit((data) => onFormSubmit(data))}>
                <Grid container spacing={4}>
                    <Grid size={6}>
                        <FormControl sx={{width:"80%"}}>
                        <Autocomplete
                            disablePortal
                            options={courses}
                            error={errors.course}
                            getOptionLabel={(option) => option.course_code}
                            renderInput={(params) => 
                            <TextField {...register("course", {required:{value:true, message:"Course is required"}})} 
                            {...params} error={errors.course} helperText={errors.course?.message} label="Course" />}
                        />
                        </FormControl>
                    </Grid>

                    <Grid size={6}>
                        <FormControl sx={{width:"80%"}}>
                        <InputLabel id="days_of_the_week" error={errors.days_of_the_week}>Class Days</InputLabel>
                        <Select {...register("days_of_the_week", {required:{value:true, message:"Class Days are required"}})} 
                        label="Class Days" 
                        multiple 
                        defaultValue={[]}
                        error={errors.days_of_the_week} 
                        >
                            <MenuItem value="1">Mon.</MenuItem>
                            <MenuItem value="2">Tue.</MenuItem>
                            <MenuItem value="3">Wed.</MenuItem>
                            <MenuItem value="4">Thu.</MenuItem>
                            <MenuItem value="5">Fri.</MenuItem>
                        </Select>
                        <FormHelperText error={errors.days_of_the_week}>{errors.days_of_the_week?.message}</FormHelperText>
                        </FormControl>
                    </Grid>

                    <Grid size={6}>
                        <TextField {...register("room_location", {required:{value:true, message:"Location is requried"}})} 
                        label="Location"
                        error={errors.room_location} 
                        helperText={errors.room_location?.message}
                        />
                    </Grid>

                    <Grid size={6}>
                        <FormControl sx={{width:"80%"}} >
                        <InputLabel error={errors.semester}id="semester_label">Semester</InputLabel>
                        <Select {...register("semester", {required:{value:true, message:"Semester is required"}})} 
                        sx={{minWidth:"100%"}}  
                        labelId="semester_label" 
                        label="Semester"
                        error={errors.semester} 
                        defaultValue=""
                        >
                            <MenuItem value="FALL">Fall</MenuItem>
                            <MenuItem value="SPRING">Winter</MenuItem>
                            <MenuItem value="SUMMER">Summer</MenuItem>
                        </Select>
                        <FormHelperText error={errors.semester}>{errors.semester?.message}</FormHelperText>
                        </FormControl>
                    </Grid>

                    <Grid size={6}>
                        <TextField {...register("scholastic_year", {required:{value:true, message:"Year is required"}})} 
                        label="Scholastic Year"
                        error={errors.scholastic_year} 
                        helperText={errors.scholastic_year?.message}
                        />
                    </Grid>

                    <Grid size={6}>
                        <TextField {...register("number_of_students", {required:{value:true, message:"Students is required"}})} 
                        label="Number of Students"
                        error={errors.number_of_students} 
                        helperText={errors.number_of_students?.message}
                        />
                    </Grid>

                    <Grid size={4}>
                        <Button type="reset" variant="outlined">Clear</Button>
                    </Grid>

                    <Grid size={4}/>

                    <Grid size={4}>
                        <Button type="sumbit" variant="contained">Submit</Button>
                    </Grid>

                </Grid>
            </form>
        </Box>
    )
}