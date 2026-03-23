import React, { useState } from "react";
import PublicationForm from "./PublicationForm";
import { Button, Grid, Paper, TextField } from "@mui/material";
import { Controller, useFieldArray } from "react-hook-form";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';



export default function PublicationsFormStep({form_id, control, errors}){
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

            <Button sx={{margin:"4%"}} variant="contained" onClick={() => {append(new Publication(form_id)); setNumberOfPublications(numberOfPublications + 1)}}>Add Publication</Button>

            <Grid container rowSpacing={2} spacing={8}>
                <Grid size={12}>
                <Controller
                    control={control}
                    name="significant_outcomes"
                    render={({field}) =>
                        <TextField
                            {...field}
                            sx={{width:"60%", margin:"auto"}}
                            multiline
                            rows={4}
                            label="Significant Outcomes"
                            helperText="(ex. Published Games, Patents)"
                        />
                    }
                />
                </Grid>

                <Grid size={12}>
                <Controller
                    control={control}
                    name="other_collaborations"
                    render={({field}) =>
                        <TextField
                            {...field}
                            multiline
                            rows={4}
                            sx={{width:"60%", margin:"auto"}}
                            label="Other Collaborations Not Mentioned Above"
                        />
                    }
                />
                </Grid>
            </Grid>
            
        </div>
    )
}