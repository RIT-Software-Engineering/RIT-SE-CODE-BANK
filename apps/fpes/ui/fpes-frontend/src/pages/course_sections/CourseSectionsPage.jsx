import { useState, useEffect } from "react";
import axios from "axios";
import CourseSectionsTable from "./CourseSectionsTable";
import CourseSectionsForm from "./CourseSectionsForm";

export default function CourseSectionsPage(){
    const [course_sections, setCourseSections] = useState([]);
    const [courses, setCourses] = useState([])

    const getAllCourseSections = () => {
        useEffect(() => {
            axios.get("http://localhost:3000/course_sections")
            .then((response) => {
                setCourseSections(response.data);
            })
        }, []);
    }

    const getAllCourses = () => {
        useEffect(() => {
            axios.get("http://localhost:3000/courses")
            .then((response) => {
                setCourses(response.data);
            })
        }, []);
    }

    getAllCourseSections();
    getAllCourses();

    return(
        <div>
            <h2>Course Sections Page</h2>
            <CourseSectionsTable course_sections={course_sections} setCourseSections={setCourseSections}/>
            <CourseSectionsForm courses={courses} setCourseSections={setCourseSections}/>
        </div>
    );
}