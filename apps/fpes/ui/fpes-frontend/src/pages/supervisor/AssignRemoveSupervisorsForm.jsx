import { Autocomplete, Button, Grid, Paper, TextField, Typography } from '@mui/material';
import axios from 'axios';
import { useState, useEffect} from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

export default function AssignRemoveSupervisorsForm(){
    const [facultyMemberToAssign, setFacultyMemberToAssign] = useState(null);
    const [supervisorToAssign, setSupervisorToAssign] = useState(null);
    const [facultyToRemoveSupervisor, setFacultyToRemoveSupervisor] = useState(null);
    const [assignOrRemove, setAssignOrRemove] = useState("Assign");

    const [faculty, setFaculty] = useState([]);
    const [supervisors, setSupervisors] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:3000/faculty")
        .then((response) => {
                setFaculty(response.data);
                console.log(faculty);
            });
        axios.get("http://localhost:3000/faculty/supervisors")
        .then(
            (response) => {
                setSupervisors(response.data);
            }
        );
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function getAvailableFacultyToAssign(){
        let availableFaculty = [];

        if(supervisorToAssign == null){
            return faculty;
        }

        faculty.map((facultyMember) => {
            if(facultyMember.supervisor_id == null && facultyMember.faculty_id != supervisorToAssign.faculty_id){
                availableFaculty.push(facultyMember);
            }
        })

        return availableFaculty;
    }

    function getAvailableFacultyToRemoveSupervisor(){
        let availableFaculty = [];

        faculty.map((facultyMember) => {
            if(facultyMember.supervisor_id != null){
                availableFaculty.push(facultyMember);
            }
        })

        return availableFaculty;
    }

    function getAvailableSupervisors(){
        let availableSupervisors = [];

        if(facultyMemberToAssign == null){
            return supervisors;
        }

        supervisors.map((supervisor) => {
            if(supervisor.faculty_id != facultyMemberToAssign.faculty_id){
                availableSupervisors.push(supervisor);
            }
        })

        return availableSupervisors;
    }

    function handleAssignSupervisor(){
        if(facultyMemberToAssign != null && supervisorToAssign != null){
            axios.put("http://localhost:3000/faculty/" + facultyMemberToAssign.faculty_id + "/assign_supervisor/" + supervisorToAssign.faculty_id)
            .then((response) => {
                console.log(response);
                const facultyMember = faculty.find(facultyMember => facultyMember.faculty_id === facultyMemberToAssign.faculty_id);
                facultyMember.supervisor_id = supervisorToAssign.faculty_id;
                setFacultyMemberToAssign(null);
                setSupervisorToAssign(null);
            })
        }
    }

    function handleRemoveSupervisor(){
        if(facultyToRemoveSupervisor != null){
            axios.put("http://localhost:3000/faculty/" + facultyToRemoveSupervisor.faculty_id + "/remove_supervisor").then(
                (response) => {
                console.log(response);
                const facultyMember = faculty.find(facultyMember => facultyMember.faculty_id === facultyToRemoveSupervisor.faculty_id);
                console.log(facultyMember);
                facultyMember.supervisor_id = null;
                setFacultyToRemoveSupervisor(null);
            }
            );
        }
    }

    return(
        <Paper sx={{minWidth:"600px", padding:"5%"}}>
        <Typography variant='h4' fontFamily={"sans-serif"} sx={{margin:"10px"}}>Assign or Remove Supervisors</Typography>
        <ToggleButtonGroup
            value={assignOrRemove}
            exclusive
            onChange={(e,value) => setAssignOrRemove(value)}
            color="primary"
        >
            <ToggleButton value="Assign" selectedColor>Assign</ToggleButton>
            <ToggleButton value="Remove">Remove</ToggleButton>
        </ToggleButtonGroup>
        {assignOrRemove == "Assign" ?
        (
        <>
        <Grid container columns={12} rowSpacing={2} spacing={2} sx={{margin:"5% 0%"}}>
            <Grid item size={6}>
                <Autocomplete
                disablePortal
                options={getAvailableFacultyToAssign()}
                value={facultyMemberToAssign}
                getOptionLabel={(option) => {
                    const supervisor = supervisors.find(supervisor => 
                    supervisor.faculty_id === option.supervisor_id);
                    const supervisorName = supervisor?.name;
                    return supervisorName ? option.name + " — " + supervisorName : option.name;
                }}
                sx={{ width: 300 }}
                renderInput={(params) => <TextField {...params} label="Faculty Member" />}
                onChange={(e,data) => setFacultyMemberToAssign(data)}
                />
            </Grid>

            <Grid item size={6}>
                <Autocomplete
                    disablePortal
                    options={getAvailableSupervisors()}
                    value={supervisorToAssign}
                    getOptionLabel={(option) => option.name}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Supervisor"/>}
                    onChange={(e,data) => setSupervisorToAssign(data)}
                />
            </Grid>
        </Grid>
        
        <Button variant='contained' onClick={() => handleAssignSupervisor()}>Assign Supervisor</Button>
        </>
        )
        : null}

        {assignOrRemove == "Remove" ? 
        (
            <>
                <Autocomplete
                    disablePortal
                    options={getAvailableFacultyToRemoveSupervisor()}
                    value={facultyToRemoveSupervisor}
                    getOptionLabel={(option) => {
                        const supervisor = supervisors.find(supervisor => 
                        supervisor.faculty_id === option.supervisor_id);
                        return option.name + " — " + supervisor.name;
                    }}  
                    sx={{ width: 300, margin:"5% auto" }}
                    renderInput={(params) => <TextField {...params} label="Faculty Member" />}
                    onChange={(e,data) => setFacultyToRemoveSupervisor(data)}
                />

                <Button variant='contained' onClick={() => handleRemoveSupervisor()}>Remove Supervisor</Button>
            </>
        )
         : null}

        </Paper>
    )
}
