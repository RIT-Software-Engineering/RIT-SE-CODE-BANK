import { Button, Step, StepContent, StepLabel, Stepper } from "@mui/material";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import ServicesFormStep from "../services/ServicesFormStep";
import { Link } from "react-router-dom";
import { validateProps } from "@mui/x-data-grid/internals";
import CourseSectionFormStep from "../course_sections/CourseSectionsFormStep";

export default function HighlightsFormPage() {
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

    function Service(form_id){
        this.title = "";
        this.hours_worked = "";
        this.form_id = "";
        this.service_type = "";
        this.other_contributions = "";
        this.form_id = form_id;
    }

    async function handleStepperChange(newIndex){
        await trigger();

        if(Object.keys(errors).length === 0){
            setActiveStep(newIndex);
        }
    }


    
    const {control, handleSubmit, reset, trigger, formState:{errors}} = useForm({defaultValues :
        {
            services : [],
            course_sections : [],
        },
        mode:"onTouched"
    });

    return (
        <div>
            <Stepper activeStep={activeStep}>
                {steps.map((step,index) => (
                    <Step key={index}>
                        <StepLabel>{step}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <form>
            {isOnFirstStep() ? <ServicesFormStep form_id={1} control={control} errors={errors} /> : null}
            {isOnLastStep() ? <CourseSectionFormStep form_id={1} control={control} errors={errors} /> : null}

            {/* Back or Cancel Button */}
            {
                isOnFirstStep() ? 
                <Button component={Link} to="/services">Cancel</Button> :
                <Button onClick={() => handleStepperChange(activeStep - 1)}>Back</Button>
            }

            {/* Forward Button */}
            {
                isOnLastStep() ? 
                <Button variant="contained" onClick={handleSubmit(data => console.log(data))}>Submit</Button> : 
                <Button onClick={() => handleStepperChange(activeStep + 1)}>Next</Button>
            }
            </form>
            
            
        </div>
    )
}