import { Box, Card, CardContent, Grid, Paper, Typography } from "@mui/material";

export default function HighlightsFormPreview({formData}){
    

    function CourseSectionCard({courseSectionData}){
        function ConvertWeekdays(daysArray){
            const DAYS_OF_THE_WEEK = ["Mon.", "Tue.", "Wed.", "Thu.", "Fri."];
            const sortedDays = daysArray.toSorted();
            let formatedDays = [];
            
            for(let i = 0; i < sortedDays.length; i++){
                formatedDays.push(DAYS_OF_THE_WEEK[sortedDays[i] - 1]);
            }

            return formatedDays;
        }

        ConvertWeekdays(courseSectionData.days_of_the_week);

        return (
            <Card sx={{maxWidth:"600px", minWidth:"400px", padding:"2%", margin:"auto 10%"}}>
                <CardContent>
                    <Typography variant="h4" style={{textAlign:"left"}}>{courseSectionData.course.label}</Typography>
                    <br/>
                    <Grid container size={12}>

                        <Grid item size={6}>
                        <Typography variant="h6" style={{textAlign:"left"}}>Year : {courseSectionData.year.$y}</Typography>
                        </Grid>

                        <Grid item size={6}>
                        <Typography variant="h6" style={{textAlign:"left"}}>Semester : {courseSectionData.semester}</Typography>
                        </Grid>
                        <Grid item size={6}>
                        <Typography variant="h6" style={{textAlign:"left"}}>Week Days : {ConvertWeekdays(courseSectionData.days_of_the_week).join(", ")}</Typography>
                        </Grid>

                        <Grid item size={6}>
                        <Typography variant="h6" style={{textAlign:"left"}}>Room Location : {courseSectionData.room_location}</Typography>
                        </Grid>

                    </Grid>
                    
                </CardContent>
                
            </Card>
        )
    }

    function ServiceCard({serviceData}){
        return (
            <Card sx={{maxWidth:"600px", minWidth:"400px", padding:"2%", margin:"auto 10%"}}>
                <CardContent>
                    <Typography variant="h4" style={{textAlign:"left"}}>{serviceData.title}</Typography>
                    <br/>
                    <Grid container size={12}>

                        <Grid item size={6}>
                        <Typography variant="h6" style={{textAlign:"left"}}>Hours Worked : {serviceData.hours_worked}</Typography>
                        </Grid>

                        <Grid item size={6}>
                        <Typography variant="h6" style={{textAlign:"left"}}>Service Type : {serviceData.service_type}</Typography>
                        </Grid>

                    </Grid>
                    
                </CardContent>
                
            </Card>
        )
    }

    function GrantCard({grantData}){
        return (
            <Card sx={{maxWidth:"600px", minWidth:"400px", padding:"2%", margin:"auto 10%"}}>
                <CardContent>
                    <Typography variant="h4" style={{textAlign:"left"}}>{grantData.title}</Typography>
                    <br/>
                    <Grid container size={12}>

                        <Grid item size={6}>
                        <Typography variant="h6" style={{textAlign:"left"}}>Funder : {grantData.funder}</Typography>
                        </Grid>

                        <Grid item size={6}>
                        <Typography variant="h6" style={{textAlign:"left"}}>Amount : {grantData.amount}</Typography>
                        </Grid>

                        <Grid item size={12}>
                        <Typography variant="h6" style={{textAlign:"left"}}>Status : {grantData.grant_status}</Typography>
                        </Grid>

                        <Grid item size={6}>
                        <Typography variant="h6" style={{textAlign:"left"}}>Start Date : {grantData.start_date}</Typography>
                        </Grid>

                        <Grid item size={6}>
                        <Typography variant="h6" style={{textAlign:"left"}}>End Date : {grantData.end_date}</Typography>
                        </Grid>

                    </Grid>
                    
                </CardContent>
                
            </Card>
        )
    }

    function PublicationCard({publicationData}){
        return (
            <Card sx={{maxWidth:"600px", minWidth:"400px", padding:"2%", margin:"auto 10%"}}>
                <CardContent>
                    <Typography variant="h4" style={{textAlign:"left"}}>{publicationData.title}</Typography>
                    <br/>
                    <Grid container size={12}>
                        <Grid item size={6}>
                        <Typography variant="h6" style={{textAlign:"left"}}>Title : {publicationData.title}</Typography>
                        </Grid>

                        <Grid item size={6}>
                        <Typography variant="h6" style={{textAlign:"left"}}>Status : {publicationData.status}</Typography>
                        </Grid>

                        <Grid item size={6}>
                        <Typography variant="h6" style={{textAlign:"left"}}>Venue : {publicationData.venue}</Typography>
                        </Grid>

                        <Grid item size={6}>
                        <Typography variant="h6" style={{textAlign:"left"}}>Proof of Signficance : {publicationData.proof_of_significance}</Typography>
                        </Grid>

                        <Grid item size={6}>
                        <Typography variant="h6" style={{textAlign:"left"}}>Date : {publicationData.date_published.$y + "-" + publicationData.date_published.$M + "-" + publicationData.date_published.$D}</Typography>
                        </Grid>

                    </Grid>
                    
                </CardContent>
                
            </Card>
        )
    }

    return (
        <Paper minWidth="1000px" padding="50px">
            <Box sx={{margin:"10%", border:"1"}} >
            <Typography variant="h3" textAlign="left">Services</Typography>
            {formData.services.length === 0 ?
            <Typography variant="h5" >No Services Added</Typography> :
            formData.services.map((service, index) => (
                <ServiceCard serviceData={service} key={index}/>
            ))
            }

            <Typography variant="h3" textAlign="left">Grants</Typography>
            {formData.grants.length === 0 ? 
            <Typography variant="h5" >No Grants Added</Typography> :
            formData.grants.map((grant, index) => (
                <GrantCard grantData={grant} key={index}/>
            ))
            }

            <Typography variant="h3" textAlign="left">Publications</Typography>
            {formData.publications.length === 0 ? 
            <Typography variant="h5" >No Publications Added</Typography> :
            formData.publications.map((publication, index) => (
                <PublicationCard publicationData={publication} key={index}/>
            ))
            }

            <Typography variant="h3" textAlign="left">Course Sections</Typography>
            {formData.course_sections.length === 0 ? 
            <Typography variant="h5" >No Course Sections Added</Typography> :
            formData.course_sections.map((course_section, index) => (
                <CourseSectionCard courseSectionData={course_section} key={index}/>
            ))
            }

            </Box>
        </Paper>
    )
}