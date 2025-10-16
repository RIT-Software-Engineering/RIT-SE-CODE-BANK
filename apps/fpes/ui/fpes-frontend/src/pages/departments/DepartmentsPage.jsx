import axios from "axios";
import { useState, useEffect } from "react";
import DepartmentsTable from "./DepartmentsTable";
import DepartmentsForm from "./DepartmentsForm";

export default function DepartmentsPage(){
    const [departments, setDepartments] = useState([])

    const getAllDepartments = () => {
        useEffect(() => {
            axios.get("http://localhost:3000/departments")
            .then((response) => {
                setDepartments(response.data);
            })
        }, []);
    }

    getAllDepartments();

    return(
        <div>
            <h2>Departments Page</h2>
            <DepartmentsTable departments={departments} setDepartments={setDepartments}/>
            <DepartmentsForm departments={departments} setDepartments={setDepartments}/>
        </div>
    );
}