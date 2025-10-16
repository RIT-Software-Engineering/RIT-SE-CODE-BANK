import { useEffect, useState } from "react";
import { FormGroup, FormControl, Input, Select, TextField, Button, MenuItem, Alert, Modal, Box, Typography, Grid, Paper, Autocomplete} from "@mui/material";
import { useForm } from "react-hook-form"

import axios from "axios";

const modal_box_style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

const text_field_style = {
    left: '0%'
}

export default function CourseSectionsForm({setCourseSections, courses}){
    return (
        <span>
            <h3>Add Course Section</h3>
            <form>
                <Autocomplete
                    disablePortal
                    options={courses}
                    getOptionLabel={(row) => row.course_code}
                    sx={{width:200}}
                    renderInput={(params) => <TextField {...params} label="Course" />}
                />
            </form>
        </span>
    )
}