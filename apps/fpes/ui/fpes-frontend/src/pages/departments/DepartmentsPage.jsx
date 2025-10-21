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

    const addDepartment = (data) => {
        axios.post("http://localhost:3000/departments", data)
        .then((res) => {
            var newDepartment = data;
            newDepartment.id = res.data[0].id;
            setDepartments(prevDepartments => [...prevDepartments, newDepartment]);
        });
    }

    getAllDepartments();

    return(
        <div>
            <h2>Departments Page</h2>
            <DepartmentsTable departments={departments} setDepartments={setDepartments} />
            <DepartmentsForm departments={departments} setDepartments={setDepartments} onSubmit={addDepartment} isUpdate={false}/>
        </div>
    );
}