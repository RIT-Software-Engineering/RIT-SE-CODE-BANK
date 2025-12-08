import { Autocomplete } from '@mui/material';
import axios from 'axios';
import { useState, useEffect} from 'react';

export default function AssignRemoveSupervisorsForm(){
    const [facultyMemberToAssign, setFacultyMemberToAssign] = useState(null);
    const [supervisorToAssign, setSupervisorToAssign] = useState(null);
    const [facultyToRemoveSupervisor, setFacultyToRemoveSupervisor] = useState(null);
    const [assignOrRemove, setAssignOrRemove] = useState("Assign");

    const [faculty, setFaculty] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:3000/faculty")
        .then(
            (response) => {
                setFaculty(response.data);
            } 
        )
    });

    function AssignSupervisor(){
        return (
            <div>
                
                <Autocomplete></Autocomplete>


                <Autocomplete></Autocomplete>
            </div>
        )
    }

    function RemoveSupervisor(){
        return( <div>

        </div>
        )
    }

    return(
        <div>
        {assignOrRemove === "Assign" ? <AssignSupervisor/> : null}
        {assignOrRemove === "Remove" ? <RemoveSupervisor/> : null}
        </div>
    )
}
