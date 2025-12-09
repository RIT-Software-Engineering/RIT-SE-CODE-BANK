import React, { useEffect, useState } from "react";
import { FormGroup, FormControl, Input, Select, TextField, Button, MenuItem, Alert, Modal, Box, Typography, Grid, Paper, IconButton, Icon} from "@mui/material";
import { useFieldArray } from "react-hook-form";
import CourseSectionForm from "./CourseSectionForm";
import axios from "axios";

export default function CourseSectionFormStep({form_id, control, errors, getValues}){
    const [numberOfSections, setNumberOfSections] = useState(0);
    const [courses, setCourses] = useState([]);

    const getAllCourses = () => {
            axios.get("http://localhost:3000/courses")
            .then((response) => {
                let sanitized_courses = [];
                response.data.forEach(course => {
                    sanitized_courses.push(
                            {
                                label : course.course_code,
                                value : course.id
                            }
                    )
                });
                setCourses(sanitized_courses);
            });

    }

    useEffect(() => getAllCourses());

    function CourseSection(form_id){
        this.room_location = "";
        this.days_of_the_week = [];
        this.number_of_students = "";
        this.semester = "";
        this.year = null;
        this.first_time_teaching_course = false;
        this.section_id = 0;
        this.curriculum_development = "";
        this.course = null;
        this.form_id = form_id;
    }

    const {fields, append, insert, remove} = useFieldArray(
        {
            control,
            name : "course_sections"
        }
    )

    function duplicateCourseSection(index){
        const sectionToDuplicate = getValues(`course_sections[${index}]`);
        insert(index + 1, sectionToDuplicate);
    }

    function removeCourseSection(index) {
        remove(index);
        setNumberOfSections(prev => prev - 1);
    }

    return (
        <div>
            {fields.map((section, index) => 
            (
                
                <Paper sx={{padding:"4% 4%", margin:"4% auto", width:"600px"}} key={section.id}>
                    <CourseSectionForm
                    key={section.id} 
                    control={control} 
                    section={`course_sections[${index}].`} 
                    errors={errors} 
                    index={index}
                    courses={courses}
                    handleRemoveSection={removeCourseSection}
                    handleDuplicateSection={duplicateCourseSection}
                    />
                </Paper>
            ))}
            <div style={{ paddingTop: "20px" }}>
                <Button variant="contained" onClick={() => {append(new CourseSection(form_id)); setNumberOfSections(numberOfSections + 1)}}>Add Course Section</Button>
            </div>
        </div>
    )
}