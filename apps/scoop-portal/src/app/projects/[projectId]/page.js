import { Button } from "@mui/material";

// The current border styles are NOT intended for the final product.
// They are just to show how the divs are organized.

// This is hardcoded and under the assumption that the user viewing the page is a scoopdinator

export default function ProjectDetails() {
    return (
        <main>
            <div id="project-header" class="flex justify-between">
                <h1 id="project-title" class="text-2xl align-middle">[ Project Title/Name ]</h1>
                <Button>Edit Project</Button>
            </div>
            <div id="description-box" class="border-2 border-dashed border-white">[ Project description ]</div>
            <hr class="pt-4 pb-4" />
            <div id="other-details" class="flex justify-between">
                <div id="participants" class="w-1/3 border-2 border-dashed border-white">
                    <div id="scoopervisor" class="">[ Scoopervisor ]</div>
                    <hr />
                    <div id="scooployee-list">[ Scooployee List ]</div>
                </div>
                <div id="actions" class="w-2/3 border-2 border-dashed border-white">[ Actions ]</div>
            </div>
        </main>
    );
}