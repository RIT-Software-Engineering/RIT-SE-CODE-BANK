import { useState } from "react";
import { Button, Grid, Paper } from "@mui/material";
import { useFieldArray } from "react-hook-form";
import GrantForm from "./GrantsForm.jsx";

export default function GrantsFormStep({ form_id, control, errors }) {
    const [number_of_grants, setNumberOfGrants] = useState(0);

    function Grant(form_id){
        this.title = "";
        this.sponsor = "";
        this.amount = "";
        this.start_date = "";
        this.end_date = "";
        this.grant_status = "Pending";
        this.other_contributions = "";
        this.form_id = form_id;
    }

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
            <Grid container rowSpacing={0} columns={12}>
                {fields.map((grant, index) => (
                    <Paper key = {grant.id} sx={{padding:"4% 4%", margin:"4% auto", width:"700px"}}>
                        <GrantForm 
                            control={control} 
                            register_grant={`grants[${index}].`} 
                            errors={errors}
                            index={index}
                            handleRemoveGrant={removeGrant}
                        />
                    </Paper>
                    ))}
            </Grid>
            <Button onClick={() => {append(new Grant(form_id)); setNumberOfGrants(number_of_grants + 1)}}>Add Grant</Button>s
        </div>
    );
}