import { Grid, Typography, IconButton, TextField, MenuItem } from "@mui/material";
import { Controller } from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";

export default function GrantForm({ control, register_grant, handleRemoveGrant, index, errors }) {
    return (
        <Grid container spacing={2} columnSpacing={2}>
            <Grid item size={10}>
                <Typography variant="h5" textAlign="left">New Grant</Typography>
            </Grid>

            <Grid item size={2}>
                <IconButton onClick={() => handleRemoveGrant(index)}>
                    <CloseIcon/>
                </IconButton>
            </Grid>

            <Grid item size={5}>
                <Controller
                    name={register_grant + "title"}
                    control={control}
                    rules={{
                        required: {value: true, message: "Title is required"},
                        maxLength: {value: 255, message: "Title cannot exceed 255 characters"}
                    }}
                    render={({field}) =>
                        <TextField {...field} 
                            label="Title"
                            error={errors.grants?.[index]?.title}
                            helperText={errors.grants?.[index]?.title?.message}
                            placeholder="Grant Title"
                            sx={{width:"100%"}}
                        />
                    }
                />
            </Grid>

            <Grid item size={5}>
                <Controller
                    name={register_grant + "funder"}
                    control={control}
                    rules={{required:"Funder is required"}}
                    render={({field}) =>
                        <TextField {...field}
                            label="Funder"
                            error={errors.grants?.[index]?.funder}
                            helperText={errors.grants?.[index]?.funder?.message}
                            placeholder="Funder"
                            sx={{width:"100%"}}
                        />
                    }
                />
            </Grid>

            <Grid item size={5}>
                <Controller
                    name={register_grant + "amount"}
                    control={control}
                    rules={{
                        required: "Amount is required",
                        pattern: {
                            value: /^[0-9]+$/,
                            message: "Amount must be numeric"
                        }
                    }}
                    render={({field}) =>
                        <TextField {...field}
                            label="Amount"
                            error={errors.grants?.[index]?.amount}
                            helperText={errors.grants?.[index]?.amount?.message}
                            placeholder="Grant Amount"
                            sx={{width:"100%"}}
                        />
                    }
                />
            </Grid>

            <Grid item size={5}>
                <Controller
                    name={register_grant + "grant_status"}
                    control={control}
                    render={({field}) =>
                        <TextField {...field}
                            select
                            label="Status"
                            sx={{width:"100%"}}
                        >
                            <MenuItem value="In Development">In Development</MenuItem>
                            <MenuItem value="In Submission">In Submission</MenuItem>
                            <MenuItem value="Funded">Funded</MenuItem>
                            <MenuItem value="Declined">Declined</MenuItem>
                        </TextField>
                    }
                />
            </Grid>

            <Grid item size={5}>
                <Controller
                    name={register_grant + "start_date"}
                    control={control}
                    rules={{required:"Start date required"}}
                    render={({field}) =>
                        <TextField {...field}
                            label="Start Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            sx={{width:"100%"}}
                        />
                    }
                />
            </Grid>

            <Grid item size={5}>
                <Controller
                    name={register_grant + "end_date"}
                    control={control}
                    rules={{required:"End date required"}}
                    render={({field}) =>
                        <TextField {...field}
                            label="End Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            sx={{width:"100%"}}
                        />
                    }
                />
            </Grid>
        </Grid>
    );
}