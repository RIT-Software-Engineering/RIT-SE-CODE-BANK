import { useState } from "react";
import { Button, Grid, Paper } from "@mui/material";
import { useForm, useFieldArray } from "react-hook-form";
import GrantForm from "./GrantsForm.jsx";

export default function GrantsFormStep({ form_id }) {
    const [number_of_grants, setNumberOfGrants] = useState(0);

    function Grant(form_id){
        this.title = "";
        this.sponsor = "";
        this.amount = "";
        this.start_date = "";
        this.end_date = "";
        this.grant_status = "Pending";
        this.form_id = form_id;
    }

    const {control, handleSubmit, formState:{errors}} = useForm({
        defaultValues : { grants : [] },
        mode: "onChange"
    });

    const {fields, append, remove} = useFieldArray({
        control,
        name: "grants"
    });

    function removeGrant(index){
        remove(index);
        setNumberOfGrants(prev => prev - 1);
    }

    return (
        <div>
            <form onSubmit={handleSubmit((data) => console.log(data))}>
                <Grid container rowSpacing={0} columns={12}>
                    {fields.map((grant, index) => (
                        <>
                        <Grid item size={2}/>
                        <Grid item size={8}>
                            <Paper sx={{padding:"4% 4%", marginTop:"4%", width:"100%"}}>
                                <GrantForm 
                                    key={grant.id} 
                                    control={control} 
                                    register_grant={`grants[${index}].`} 
                                    errors={errors}
                                    index={index}
                                    handleRemoveGrant={removeGrant}
                                />
                            </Paper>
                        </Grid>
                        <Grid item size={2}/>
                        </>
                    ))}
                </Grid>
                <Button type="submit">Submit</Button>
                <Button onClick={() => {append(new Grant(form_id)); setNumberOfGrants(number_of_grants + 1)}}>Add Grant</Button>
            </form>
        </div>
    );
}