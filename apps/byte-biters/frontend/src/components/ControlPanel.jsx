import Button from "./Button";

export default function ControlPanel({ onAssemble, onRun, onStepForward, onStepBackward, onRestart, canAssemble, canRun, canStepForward, canStepBackward, canRestart,}) {
    const getButtonClass = (enabled) =>
        `px-4 py-2 rounded transition ${
        enabled
            ? "bg-button-default text-button-text rounded-full hover:bg-button-hover"
            : "bg-gray-500 text-gray-300 opacity-60 rounded-full cursor-not-allowed"
        }`
    
    return (
        // all the buttons in the control panel, all have same styling
        //functionality handled in App
        <div className="bg-s h-full bg-main-secondary flex flex-row items-center justify-center gap-4 py-4">
            <Button variant="primary" onClick={onAssemble} disabled={!canAssemble} className={getButtonClass(canAssemble)}>Assemble</Button>
            <Button variant="primary" onClick={onRun} disabled={!canRun} className={getButtonClass(canRun)}> Run </Button>
            <Button variant="primary" onClick={onStepBackward} disabled={!canStepBackward} className={getButtonClass(canStepBackward)}> Backstep </Button>
            <Button variant="primary" onClick={onStepForward} disabled={!canStepForward} className={getButtonClass(canStepForward)}> Nextstep </Button>
            <Button variant="primary" onClick={onRestart} disabled={!canRestart} className={getButtonClass(canRestart)}>Restart</Button>
        </div>
    )
}