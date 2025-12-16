import { Button, Paper, Step, StepButton, StepContent, StepLabel, Stepper } from "@mui/material";
import React, { useState, useEffect} from "react";
import { useForm } from "react-hook-form";
import ServicesFormStep from "../services/ServicesFormStep";
import { Link, useNavigate, useParams } from "react-router-dom";
import { validateProps } from "@mui/x-data-grid/internals";
import axios from "axios";
import CourseSectionFormStep from "../course_sections/CourseSectionsFormStep";
import PublicationsFormStep from "../publications/PublicationsFormStep";
import StudentSupportFormStep from "../student_support/StudentSupportFormStep";
import GrantsFormStep from "../grants/GrantsFormStep";

export default function HighlightsFormPage({facultyId}) {
    const [activeStep, setActiveStep] = useState(0);
    const navigate = useNavigate();
    const { id } = useParams();

    const steps = [

        "Services",
        "Grants",
        "Publications",
        "Student Support",
        "Course Sections",
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
            services : [
                {
                    title: "",
                    hours_worked: "",
                    service_type: "",
                    other_contributions: "",
                    form_id: facultyId 
                }
            ],
            professional_development : "",
            course_sections : [
                {
                    room_location: "",
                    days_of_the_week: [],
                    number_of_students: "",
                    semester: "",
                    year: null,
                    first_time_teaching_course: false,
                    number_of_sections: 0,
                    curriculum_development: "",
                    course: null,
                    form_id: facultyId,
                }
            ],
            publications : [
                {
                    title: "",
                    status: "",
                    venue: "",
                    proof_of_significance: "",
                    date_published: null,
                    form_id: facultyId
                }
            ],
            significant_outcomes : "",
            other_collaborations : "",
            grants : [
                {
                    title: "",
                    funder: "",
                    amount: "",
                    start_date: "",
                    end_date: "",
                    grant_status: "Pending",
                    other_contributions: "",
                    form_id: facultyId   
                }
            ],
            student_support: {
                independent_studies_supervised: 0,
                bs_cs_students_supervised: 0,
                ms_defence_chair: 0,
                ms_defence_member: 0,
                active_ms_cs_as_chair: 0,
                other_bs_projects: 0,
                other_ms_projects: 0,
                current_phd_advisees: 0,
                phd_passed_rpa_as_chair: 0,
                phd_passed_pro_as_chair: 0,
                phd_passed_def_as_chair: 0,
                phd_rpa_def_pro_as_member: 0,
                other_contributions: ""
            }
        },
        mode:"onChange"
    });

    //function that was intended to support loading a form draft
    /*useEffect(() => {
        if (id) {
            axios.get(`http://localhost:3000/highlights/${id}`)
                .then(res => {
                    reset(res.data);
                });
        } else {
            axios.get(`http://localhost:3000/highlights/draft/${facultyId}`)
                .then(res => {
                    if (res.data) reset(res.data);
                });
        }
    }, [id, facultyId, reset]);*/

    async function handleSaveDraft(data){
        data.faculty_information_id = facultyId;
        data.isSubmission = false;

        await axios.post("http://localhost:3000/highlights/draft", data);

        alert("Draft saved");
    }

    function handleFormSubmission(data){
        data.faculty_information_id = facultyId;
        data.isSubmission = true;
        console.log(facultyId)
        console.log(data)
        axios.post("http://localhost:3000/highlights/submit", data);
        navigate("/highlights")
    }

    return (
        <Paper sx={{minWidth:"75%", padding:"10%"}}>
        <div style={{margin:"100px 0px", alignContent:"start", position:"absolute", top:"0px", transform: "translateX(-50%)", left:"50%"}}>
            <Stepper sx={{minWidth:"800px"}} activeStep={activeStep} nonLinear>
                {steps.map((step,index) => (
                    <Step  key={index}>
                        <StepButton onClick={() => handleStepperChange(index)}>{step}</StepButton>
                    </Step>
                ))}
            </Stepper>

            <form >
                {isOnFirstStep() ? <ServicesFormStep form_id={1} control={control} errors={errors} /> : null}
                {activeStep === 1 ? <GrantsFormStep form_id={1} control={control} errors={errors}/> : null}
                {activeStep === 2 ? <PublicationsFormStep form_id={1} control={control} errors={errors}/> : null}
                {activeStep === 3 ? <StudentSupportFormStep form_id={1} control={control} errors={errors}/> : null}
                {isOnLastStep() ? <CourseSectionFormStep form_id={1} control={control} errors={errors}  getValues={getValues}/> : null}
                <div style={{ paddingTop: "20px" }}>
                    {/* Back or Cancel Button */}
                    {
                        isOnFirstStep() ? 
                        <Button component={Link} to="/highlights">Cancel</Button> :
                        <Button onClick={() => handleStepperChange(activeStep - 1)}>Back</Button>
                    }

                    {/* Save Draft Button */}

                    <Button onClick={handleSubmit(data => handleSaveDraft(data))} > 
                        Save Draft
                    </Button>

                    {/* Forward Button */}
                    {
                        isOnLastStep() ? 
                        <Button variant="contained" onClick={handleSubmit((data) => handleFormSubmission(data))}>Submit</Button> : 
                        <Button onClick={() => handleStepperChange(activeStep + 1)}>Next</Button>
                    }
                </div>
            </form>
        </div>
        </Paper>
        
    )
}