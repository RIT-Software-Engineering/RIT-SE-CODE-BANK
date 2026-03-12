import Button from "./Button";

export default function ControlPanel({ onAssemble, onRun, onStepForward, onStepBackward, onRestart }) {
    return (
        //palceholder buttons, no functionality
        //add onclick later 
        <div className="bg-s h-16 bg-main-secondary flex flex-row items-center justify-center gap-4 py-4">
            <Button variant="primary" onClick={onAssemble}>Assemble</Button>
            <Button variant="primary" onClick={onRun}> Run </Button>
            {/* remember to add backstep button here */}
            <Button variant="primary" onClick={onStepForward}> Step </Button>
            <Button variant="primary" onClick={onRestart}>Restart</Button>
        </div>
    )
}