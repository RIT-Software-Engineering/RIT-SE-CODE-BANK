import { Button, Grid, Paper } from "@mui/material";
import { useForm, useFieldArray } from "react-hook-form";
import GrantForm from "./GrantsForm.jsx";

export default function GrantsFormStep({ form_id }) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { grants: [] },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "grants",
  });

  function addGrant() {
    append({
      title: "",
      sponsor: "",
      amount: "",
      start_date: "",
      end_date: "",
      grant_status: "Pending",
      form_id: form_id,
    });
  }

  function removeGrant(index) {
    remove(index);
  }

  const onSubmit = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        {fields.map((grant, index) => (
          <Grid item xs={12} key={grant.id}>
            <Paper sx={{ p: 2 }}>
              <GrantForm
                control={control}
                register_grant={`grants[${index}].`}
                index={index}
                errors={errors}
                handleRemoveGrant={removeGrant}
              />
            </Paper>
          </Grid>
        ))}
        <Grid item xs={12}>
          <Button variant="outlined" onClick={addGrant}>
            Add Grant
          </Button>
          <Button variant="contained" type="submit" sx={{ ml: 2 }}>
            Submit All
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}