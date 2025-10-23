import { useEffect, useState } from "react";
import { FormGroup, FormControl, Input, Select, TextField, Button, MenuItem, Alert, Modal, Box, Typography, Grid, Paper} from "@mui/material";
import { Controller } from "react-hook-form";

export default function ServiceForm({control, register_service}){
    return (
        <Controller
            name={register_service + ".title"}
            control={control}
            rules={{required : true}}
            render={({field}) => <TextField {...field}/>}
        />
    )
}