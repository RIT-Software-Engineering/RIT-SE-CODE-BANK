import { useState, useEffect} from 'react';

export default function AssignRemoveSupervisorsForm(){
    const [facultyMemberToAssign, setFacultyMemberToAssign] = useState(null);
    const [supervisorToAssign, setSupervisorToAssign] = useState(null);
    const [facultyToRemoveSupervisor, setFacultyToRemoveSupervisor] = useState(null);
    const [assignOrRemove, setAssignOrRemove] = useState("Assign");

    function AssignSupervisor(){

    }

    function RemoveSupervisor(){

    }

    return(
        <div>
        {assignOrRemove === "Assign" ? AssignSupervisor : null}
        {assignOrRemove === "Remove" ? RemoveSupervisor : null}
        </div>
    )
}
