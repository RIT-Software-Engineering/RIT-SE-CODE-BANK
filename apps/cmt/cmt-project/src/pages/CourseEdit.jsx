import React, { useState } from "react";
import { CourseDetailsStep } from "./CoursePage";
import { Button } from "react-bootstrap";

export function CourseEdit({ initialCourseData, onSubmit, setView }) {
    const [courseData, setCourseData] = useState(initialCourseData)
    return (<>
        <CourseDetailsStep courseData={courseData} setCourseData={setCourseData}/>
        <div className="d-flex gap-2">
            <Button className="m-10" onClick={() => setView("list")}> Back </Button>
            <Button onClick={() => onSubmit(courseData.id, courseData)} > Edit Course </Button>
        </div>
    </>)
}