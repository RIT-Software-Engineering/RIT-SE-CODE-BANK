import { useState, useEffect} from 'react';
import SupervisedFacultyTable from './SupervisedFacultyTable';
import AssignRemoveSupervisorsForm from './AssignRemoveSupervisorsForm';
import SupervisedFormsTable from './SupervisedFormsTable';
import { Grid } from '@mui/material';

export default function SupervisingPage({facultyId, roles}){
    return (
        <div>
            {roles.has("Supervisor") ? 
            <Grid columnSpacing={2} container size={12}>
            <Grid size={6}>
                <SupervisedFacultyTable supervisorId={facultyId}/>
            </Grid>
            <Grid size={6}>
                <SupervisedFormsTable facultyId={facultyId}/>
            </Grid>
            </Grid>
            : null}
            {roles.has("Admin") ? <AssignRemoveSupervisorsForm/> : null}
        </div>
    )
}