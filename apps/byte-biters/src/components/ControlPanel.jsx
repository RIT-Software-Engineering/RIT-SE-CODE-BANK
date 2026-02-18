import Button from "./Button";

export default function ControlPanel() {
    return (
        <div className="bg-yellow-700 h-16 flex flex-row items-center justify-center gap-4">
            <Button variant="primary"> Assemble </Button>
            <Button variant="primary"> Run </Button>
            <Button variant="primary"> Step </Button>
            <Button variant="primary"> Restart </Button>
        </div>
    )
}