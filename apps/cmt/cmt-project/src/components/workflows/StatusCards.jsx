import { Check, Pencil, X } from "lucide-react";
import { Card } from "react-bootstrap";

export function StatusCardCompleted() {
    return <Card>
        <Card.Body 
            style={{ backgroundColor: ``}}
            className={`bg-green-500 text-white`}
        >
            <div className="flex flex-col w-24 items-center h-full justify-evenly">
                <Check />
                <p className="my-0">Completed!</p>
            </div>
        </Card.Body>
    </Card>
}

export function StatusCardInProgress() {
    return <Card>
        <Card.Body 
            style={{ backgroundColor: ``}}
            className={`bg-yellow-500 text-white`}
        >
            <div className="flex flex-col w-24 items-center h-full justify-evenly">
                <Pencil />
                <p className="my-0">In progress</p>
            </div>
        </Card.Body>
    </Card>
}

export function StatusCardNotStarted() {
    return <Card>
        <Card.Body 
            style={{ backgroundColor: ``}}
            className={`bg-red-500 text-white`}
        >
            <div className="flex flex-col w-24 items-center h-full justify-evenly">
                <X />
                <p className="my-0">Not Started</p>
            </div>
        </Card.Body>
    </Card>
}

