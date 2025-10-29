import React, { useState } from "react";
import { useFieldArray } from "react-hook-form";

export default function CourseSectionFormStep({form_id, control, errors}){
    const [numberOfSections, setNumberOfSections] = useState(0);

    function CourseSection(){
        this.course = "";
        this.room_location = "";
        this.days_of_the_week = "";
        this.number_of_students = "";
        this.semester = "";
        this.scholastic_year = "";
        this.first_time_teaching_course = false;
        this.course_id = 0;
        this.form_id = form_id;
    }

    const {fields, append, remove} = useFieldArray(
        {
            control,
            name : "course_sections"
        }
    )

    function removeCourseSection(index) {
        remove(index);
        setNumberOfSections(prev => prev - 1);
    }

    return (
        <div>
        <Grid container rowSpacing={0} columns={12}>
        {fields.map((section, index) => 
        (
            <Paper sx={{padding:"4% 4%", marginTop:"4%", width:"600px"
            }}>
                <CourseSectionForm
                key={section.id} 
                control={control} 
                register_service={`course_sections[${index}].`} 
                errors={errors} 
                index={index}
                handleRemoveSection={removeCourseSection}
                />
            </Paper>
        ))}
        </Grid>
        <Button onClick={() => {append(new Service(form_id)); setNumberOfSections(number_of_services + 1)}}>Add Service</Button>
        </div>
    )
}