import { CheckCircle2, MinusCircle, XCircle } from "lucide-react";

export function StatusIcon({ stateType }) {
    if (stateType === "notStarted") 
        return <StatusIconNotStarted />
    else if (stateType === "inProgress")
        return <StatusIconInProgress />
    else if (stateType === "completed")
        return <StatusIconCompleted />
    else
        throw Error(`Unrecognized stateType: ${stateType}`)
}

export function StatusIconCompleted() {
    return <div className="flex items-center gap-2"><CheckCircle2 className="text-green-500"/><p className="text-green-500 mb-0"> Completed! </p></div>
}

export function StatusIconInProgress() {
    return <div className="flex items-center gap-2"><MinusCircle className="text-yellow-500"/><p className="text-yellow-500 mb-0"> In Progress </p></div>
}

export function StatusIconNotStarted() {
    return <div className="flex items-center gap-2"><XCircle className="text-red-500"/><p className="text-red-500 mb-0"> Not Started </p></div>
}

