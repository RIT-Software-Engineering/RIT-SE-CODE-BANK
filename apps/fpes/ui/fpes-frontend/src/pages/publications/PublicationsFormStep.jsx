import React, { useState } from "react";
import PublicationForm from "./PublicationForm";
import { Button, Grid, Paper } from "@mui/material";
import { useFieldArray } from "react-hook-form";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';



export default function PublicationsFormStep({form_id, control, errors, handle}){
    const [numberOfPublications, setNumberOfPublications] = useState(0);

    function Publication(form_id){
        this.title = "";
        this.status = "";
        this.venue = "";
        this.proof_of_significance = "";
        this.date_published = null;
        this.form_id = form_id;
    }

    const {fields, append, remove} = useFieldArray(
        {
            control,
            name : "publications"
        }
    )

    function removePublication(index){
        remove(index);
        setNumberOfPublications(numberOfPublications - 1);
    }

    return(
        <div>
            {fields.map((publication, index) =>
                <Paper sx={{padding:"4% 4%", margin:"4% auto", width:"600px"}} key={publication.id}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <PublicationForm 
                    control={control} 
                    handleRemovePublication={removePublication}
                    errors={errors}
                    publication={`publications[${index}].`} 
                    index={index}
                    />
                    </LocalizationProvider>
                </Paper>
            )}
            <Button onClick={() => {append(new Publication(form_id)); setNumberOfPublications(numberOfPublications + 1)}}>Add Publication</Button>
        </div>
    )
}