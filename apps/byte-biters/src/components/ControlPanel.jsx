import Button from "./Button";

export default function ControlPanel() {
    return (
        //palceholder buttons, no functionality
        <div className="bg-s h-16 bg-main-secondary flex flex-row items-center justify-center gap-4">
            <Button variant="primary"> Assemble </Button>
            <Button variant="primary"> Run </Button>
            <Button variant="primary"> Step </Button>
            <Button variant="primary"> Restart </Button>
        </div>
    )
}