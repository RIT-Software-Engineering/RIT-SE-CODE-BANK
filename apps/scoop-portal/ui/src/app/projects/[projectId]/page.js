import { Button } from "@mui/material";
import { Edit } from "@mui/icons-material";

// The current border styles are NOT intended for the final product.
// They are just to show how the divs are organized.

// This is hardcoded and under the assumption that the user viewing the page is an Admin

async function ProjectDetails() {
    // Use to compare the loading skeleton to the page's content
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    return (
        <main>
            <div id="project-header" className="flex justify-between mb-4">
                <h1 id="project-title" className="text-2xl align-middle">
                    Demo Project
                </h1>
                <Button color="primary" startIcon={<Edit />}>
                    Edit Project
                </Button>
            </div>
            <div id="description-box" className="border-2 border-dashed mb-6">
                [ Project description ]
            </div>
            {/* <hr className="pt-4 pb-4" /> */}
            <div id="other-details" className="flex justify-between">
                <div id="participants" className="w-1/3 border-2 border-dashed">
                    <div id="employer" title="Employer">
                        Employer
                    </div>
                    <div id="employee-list" title="Employees">
                        <ul>
                            <li>Employee 1</li>
                            <li>Employee 2</li>
                            <li>Employee 3</li>
                        </ul>
                    </div>
                </div>
                <div id="actions" className="w-2/3 border-2 border-dashed">
                    [ Actions ]
                    <ul className="list-disc list-inside">
                        <li>Action 1</li>
                        <li>Action 2</li>
                        <li>Action 3</li>
                    </ul>
                </div>
            </div>
        </main>
    );
}

export default ProjectDetails;
