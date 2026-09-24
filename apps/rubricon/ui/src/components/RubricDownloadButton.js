import Link from "next/link";


export default function RubricDownloadButton({ data }) {
    return (
        <div>
            <Link href={`data:application/json,${JSON.stringify(data)}`} download={`${data.title}_Rubric.json`}>{"DOWNLOAD"}</Link>
        </div>
    )
}