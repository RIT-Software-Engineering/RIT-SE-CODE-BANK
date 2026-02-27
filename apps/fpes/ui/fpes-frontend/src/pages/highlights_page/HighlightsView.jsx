// This component is no longer used. HighlightsViewModal now uses DataPreviewPage instead.
// Keeping this file for reference in case the old format is needed.

/*
import "./HighlightsView.css"
import { Button } from "@mui/material";

export default function HighlightsView({formData}){
    console.log(formData);

    const handleViewPDF = () => {
        window.open(`http://localhost:3000/file/pdf/${formData.highlights.form_id}`, '_blank');
    };

    return (
        <div style={{margin: "auto", overflow : "scroll", maxWidth:"800px", maxHeight:"400px"}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                <h1>Highlights Statement for Calendar Year <i>{formData.highlights.last_saved.match(/^\d{4}/)}</i></h1>
                <Button variant="outlined" onClick={handleViewPDF}>View Original PDF</Button>
            </div>
     
            <table>
                <tbody>
                <tr>
                    <th>Name</th>
                    <td>{formData.faculty_information.name}</td>
                </tr>
                <tr>
                    <th>Rank</th>
                    <td>{formData.faculty_information.rank}</td>
                </tr>
                <tr>
                    <th>Unit(s)</th>
                    <td>{formData.faculty_information.unit}</td>
                </tr>
                <tr>
                    <th>Affiliations</th>
                    <td>{formData.faculty_information.affiliations}</td>
                </tr>
                <tr>
                    <th>Period</th>
                    <td>{formData.highlights.last_saved.match(/^\d{4}/)}</td>
                </tr>
                </tbody>
            </table>

            <h2>Scholarship</h2>

            <h3>Grants</h3>
            {formData.grants.map((grant, index) => {
                return (
                <p key={index}>
                    Title : {grant.title} <br/>
                    Funder : {grant.funder} <br/>
                    Amount : {grant.amount} <br/>
                    Status : {grant.grant_status} <br/>
                    {grant.start_date?.match(/^\d{4}-\d{2}-\d{2}/) || 'N/A'} - {grant.end_date?.match(/^\d{4}-\d{2}-\d{2}/) || 'N/A'} <br/><br/>
                    Other Contributions : {grant.other_contributions || 'N/A'}
                </p>
                )
            })}

            <h3>Publications</h3>
            {formData.publications.map((publication, index) => {
                return (
                <p key={index}>
                    Title : {publication.title} <br/>
                    Status : {publication.status} <br/>
                    Venue : {publication.venue} <br/>
                    Proof Of Significance : {publication.proof_of_significance} <br/>
                    Date Published : {publication.date_published.match(/^\d{4}-\d{2}-\d{2}/)}
                </p>
                )
            })}

            <h4>Significant Outcomes</h4>
            <p>
                {formData.highlights.significant_outcomes}
            </p>

            <h4>Other Collaborations</h4>
            <p>
                {formData.highlights.collaborations_section}
            </p>

            <h2>Teaching</h2>

            <h3>Course Sections Taught</h3>
            {formData.course_sections.map((course_section, index) => {
                return (
                    <div key={index}>
                    <p>
                        {course_section.course_name} <br/>
                        {course_section.section_id} <br/>
                        {course_section.days_of_the_week} <br/>
                        {course_section.semester} {course_section.year} <br/>
                        {course_section.number_of_students} <br/>
                        {course_section.first_time_teaching_course}
                    </p>
                    </div>
                )
            })}

            <h3>Curriculum Development</h3>
            <p>
                {formData.highlights.curriculum_development}
            </p>

            <h2>Student Support</h2>

            <table>
                <tbody>
                <tr>
                    <th>Independent studies supervised in 2024</th>
                    <td>{formData.student_support.independent_studies_supervised}</td>
                </tr>
                <tr>
                    <th>BS capstone students supervised in 2024</th>
                    <td>{formData.student_support.bs_cs_students_supervised}</td>
                </tr>

                <tr>
                    <th>MS capstone students who defended in 2024 with you as chair</th>
                    <td>{formData.student_support.ms_defence_chair}</td>
                </tr>
                
                <tr>
                    <th>MS capstone students who defended in 2024 with you as member</th>
                    <td>{formData.student_support.ms_defence_member}</td>
                </tr>


                <tr>
                    <th>MS capstones still active (signed proposals) in 2024 with you as chair</th>
                    <td>{formData.student_support.active_ms_cs_as_chair}</td>
                </tr>
                
                <tr>
                    <th>Other BS students in research or projects (not included in counts above)</th>
                    <td>{formData.student_support.other_bs_projects}</td>
                </tr>
                
                <tr>
                    <th>Other MS students in research or projects (not included in counts above)</th>
                    <td>{formData.student_support.other_ms_projects}</td>
                </tr>

                <tr>
                    <th>Current PhD student advisees</th>
                    <td>{formData.student_support.current_phd_advisees}</td>
                </tr>
                
                <tr>
                    <th>PhD students who passed RPA in 2024 with you as chair</th>
                    <td>{formData.student_support.phd_passed_rpa_as_chair}</td>
                </tr>
                
                <tr>
                    <th>PhD students who passed their Proposal in 2024 with you as chair</th>
                    <td>{formData.student_support.phd_passed_pro_as_chair}</td>
                </tr>

               <tr>
                    <th> PhD students who passed their Defense in 2024 with you as chair</th>
                    <td>{formData.student_support.phd_passed_def_as_chair}</td>
               </tr>

               <tr>
                    <th>Other PhD students who participated in RPA, defended their proposal, or defended their dissertation in 2024 with you as a committee member (not as the advisor)</th>
                    <td>{formData.student_support.phd_rpa_def_pro_as_member}</td>
               </tr>
               </tbody>
            </table>

            <h3>Other Successes In Student Supervision</h3>
            <p>
                {formData.student_support.other_contributions}
            </p>

            <h2>Service</h2>

            {formData.services.map((service, index) => {
                return (
                <p key={index}>
                    {service.title}
                    {service.type}
                    {service.hours_worked} Hours <br/><br/>
                    {service.other_contributions}
                </p>
                )
            })}

            <h3>Professional Development</h3>

            <p>
                {formData.highlights.professional_development}
            </p>
            
        </div>
    )
}
*/