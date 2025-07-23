import Header from "@components/Header";
import { Typography } from "@mui/material";

async function Projects() {
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    return (
        <>
            <Header />
            <div>
                <Typography variant="h1">Projects</Typography>
                <main>
                    <ul className="list-disc">
                        <li>
                            <a href="/projects/1">Demo Project</a>
                        </li>
                    </ul>
                </main>
            </div>
        </>
    );
}

export default Projects;
