async function Projects() {
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    return (
        <div>
            <h1 className="text-2xl align-middle">Projects</h1>
            <main>
                <ul className="list-disc">
                    <li>
                        <a href="/projects/1">Demo Project</a>
                    </li>
                </ul>
            </main>
        </div>
    );
}

export default Projects;
