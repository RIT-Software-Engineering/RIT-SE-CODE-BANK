import Skeleton from "../../_components/Skeleton";

function ProjectDetailsLoading() {
    return (
        <main>
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="w-[24ch] h-[2.5rem]" />{" "}
                {/* Project Title */}
                <Skeleton className="w-[10ch] h-[2.5rem]" /> {/* Edit Button */}
            </div>
            <Skeleton className="w-full h-[4rem] mb-6" /> {/* Description */}
            {/* <hr className="pt-4 pb-4" /> */}
            <div className="flex justify-between">
                <div className="w-1/3 space-y-2">
                    <Skeleton className="w-[16ch] h-[1.5rem]" />{" "}
                    {/* Employer */}
                    <div>
                        <Skeleton className="w-[12ch] h-[1.25rem] mb-1" />
                        <Skeleton className="w-[12ch] h-[1.25rem] mb-1" />
                        <Skeleton className="w-[12ch] h-[1.25rem]" />
                    </div>
                </div>
                <div id="actions" className="w-2/3">
                    <Skeleton className="w-full h-[8rem]" /> {/* Actions */}
                </div>
            </div>
        </main>
    );
}

export default ProjectDetailsLoading;
