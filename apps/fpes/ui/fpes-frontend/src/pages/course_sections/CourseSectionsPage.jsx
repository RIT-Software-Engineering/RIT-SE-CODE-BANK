import { useState, useEffect } from "react";
import axios from "axios";
import CourseSectionsTable from "./CourseSectionsTable";

export default function CourseSectionsPage(){
    const [course_sections, setCourseSections] = useState([]);

    const getAllCourseSections = () => {
        useEffect(() => {
            axios.get("http://localhost:3000/course_sections")
            .then((response) => {
                setCourseSections(response.data);
            })
        }, []);
    }

    getAllCourseSections();

    return(
        <div>
            <h2>Course Sections Page</h2>
            <CourseSectionsTable course_sections={course_sections} setCourseSections={setCourseSections}/>
        </div>
    );
}