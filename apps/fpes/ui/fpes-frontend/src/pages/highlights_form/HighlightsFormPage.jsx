import { Button, Step, StepContent, StepLabel, Stepper } from "@mui/material";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import ServicesFormStep from "../services/ServicesFormStep";
import { Link } from "react-router-dom";
import { validateProps } from "@mui/x-data-grid/internals";
import axios from "axios";
import CourseSectionFormStep from "../course_sections/CourseSectionsFormStep";
import PublicationsFormStep from "../publications/PublicationsFormStep";

export default function HighlightsFormPage({facultyID}) {
    const [activeStep, setActiveStep] = useState(0);

    const steps = [
        "Services",
        "Publications",
        "Course Sections"
    ]

    function isOnFirstStep(){
        return activeStep === 0;
    }

    function isOnLastStep(){
        return activeStep === steps.length - 1;
    }

    async function handleStepperChange(newIndex){
        await trigger();

        if(Object.keys(errors).length === 0){
            setActiveStep(newIndex);
        }
    }

    const {control, handleSubmit, getValues, reset, trigger, formState:{errors}} = useForm({defaultValues :
        {
            services : [],
            professional_development : "",
            course_sections : [],
            publications : [],
            significant_outcomes : "",
            other_collaborations : "",
        },
        mode:"onChange"
    });

    function handleFormSubmission(data){
        console.log(data)
        data.faculty_information_id = 1;
        axios.post("http://localhost:3000/highlights/submit", data);
    }

    return (
        <div>
            <Stepper sx={{minWidth:"800px"}} activeStep={activeStep}>
                {steps.map((step,index) => (
                    <Step key={index}>
                        <StepLabel>{step}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <form>
            {isOnFirstStep() ? <ServicesFormStep form_id={1} control={control} errors={errors} /> : null}
            {activeStep === 1 ? <PublicationsFormStep form_id={1} control={control} errors={errors}/> : null}
            {isOnLastStep() ? <CourseSectionFormStep form_id={1} control={control} errors={errors}  getValues={getValues}/> : null}

            {/* Back or Cancel Button */}
            {
                isOnFirstStep() ? 
                <Button component={Link} to="/services">Cancel</Button> :
                <Button onClick={() => handleStepperChange(activeStep - 1)}>Back</Button>
            }

            {/* Forward Button */}
            {
                isOnLastStep() ? 
                <Button variant="contained" onClick={handleSubmit((data) => handleFormSubmission(data))}>Submit</Button> : 
                <Button onClick={() => handleStepperChange(activeStep + 1)}>Next</Button>
            }
            </form>
            
            
        </div>
    )
}