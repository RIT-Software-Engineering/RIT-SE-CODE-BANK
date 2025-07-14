import EvaluationList from "@/components/EvaluationList"
import Link from "next/link"

export default async function RubricEvaluationsPage({params}) {
    const { rubricId } = await params;

    return (
        <>
            <div className="flex flex-col items-center justify-center gap-4">
                <div className="grid grid-cols-3 items-center p-4 w-full text-white font-bold bg-primary">
                    <Link href={`/rubrics/${rubricId}`} className="text-xl hover:text-black mr-auto">{"Cancel"}</Link>
                    <h1 className="text-4xl mx-auto">My Evaluations</h1>
                    <Link href="/create" className="text-xl hover:text-black ml-auto">{"Create"}</Link>
                </div>
                <EvaluationList />
            </div>
        </>
    )
}