import { FormControl, FormControlLabel, FormHelperText, Grid, IconButton, MenuItem, TextField, Typography } from "@mui/material";
import React from "react";
import { Controller } from "react-hook-form";
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function PublicationForm({control, publication, handleRemovePublication, index, errors}){
    return(
        <Grid container spacing={2} columnSpacing={8}>
            <Grid item size={10}>
                <Typography variant="h5" textAlign={"left"}>New Publication</Typography>
            </Grid>

            <Grid size={2}>
                <IconButton onClick={() => handleRemovePublication(index)}>
                    <CloseIcon/>
                </IconButton>
            </Grid>
            <Grid size={6}>
                <Controller
                    control={control}
                    name={publication + "title"}
                    rules={{required:"Title is required"}}
                    render={({field}) =>
                        <TextField
                            {...field}
                            label="Title"
                            placeholder="Title"
                            error={errors.publications?.[index]?.title}
                            helperText={errors.publications?.[index]?.title?.message}
                            sx={{width:"100%"}}
                        />
                    }
                />
            </Grid>

            <Grid size={6}>
                <Controller
                    control={control}
                    name={publication + "status"}
                    rules={{required:"Status is required"}}
                    render={({field}) => 
                        <TextField
                            {...field}
                            label="Status"
                            error={errors.publications?.[index]?.status}
                            helperText={errors.publications?.[index]?.status?.message}
                            select
                            sx={{width:"100%"}}
                        >
                            <MenuItem value="In Progress">In Progress</MenuItem>
                            <MenuItem value="In Submission">In Submission</MenuItem>
                            <MenuItem value="Accepted">Accepted</MenuItem>
                            <MenuItem value="Published">Published</MenuItem>
                        </TextField>

                    }
                />
            </Grid>

            <Grid size={6}>
                <Controller
                    control={control}
                    name={publication + "venue"}
                    rules={{required:"Venue is required"}}
                    render={({field}) =>
                        <TextField
                            {...field}
                            label="Venue"
                            placeholder="Venue"
                            error={errors.publications?.[index]?.venue}
                            helperText={errors.publications?.[index]?.venue?.message}
                            sx={{width:"100%"}}
                        />
                    }
                />
            </Grid>

            <Grid size={6}>
                <Controller
                    control={control}
                    name={publication + "proof_of_significance"}
                    rules={{required:"Significance is required"}}
                    render={({field}) =>
                        <TextField
                            {...field}
                            label="Proof of Significance"
                            placeholder="Proof of Significance"
                            error={errors.publications?.[index]?.proof_of_significance}
                            helperText={errors.publications?.[index]?.proof_of_significance?.message}
                            sx={{width:"100%"}}
                        />
                    }
                />
            </Grid>

            <Grid size={6}>
                <Controller
                    control={control}
                    name={publication + "date_published"}
                    rules={{required:"Date is required"}}
                    render={({field}) =>
                        <DatePicker
                            {...field}
                            label="Date"
                            placeholder="Proof of Significance"
                            error={errors.publications?.[index]?.date_published}
                            helperText={errors.publications?.[index]?.date_published?.message}
                            sx={{width:"100%"}}
                            slotProps={{
                            textField: {
                                error: errors.publications?.[index]?.date_published,
                                helperText: errors.publications?.[index]?.date_published?.message,
                            },}}
                        />
                    }
                />
            </Grid>


        </Grid>
    )
}