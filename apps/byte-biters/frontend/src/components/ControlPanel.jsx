import Button from "./Button";

export default function ControlPanel({ onAssemble, onRun, onStepForward, onStepBackward, onRestart }) {
    return (
        <div className="bg-s h-full bg-main-secondary flex flex-row items-center justify-center gap-4 py-4">
            <Button variant="primary" onClick={onAssemble}>Assemble</Button>
            <Button variant="primary" onClick={onRun}> Run </Button>
            <Button variant="primary" onClick={onStepBackward}> Backstep </Button>
            <Button variant="primary" onClick={onStepForward}> Nextstep </Button>
            <Button variant="primary" onClick={onRestart}>Restart</Button>
        </div>
    )
}