import { useCallback } from "react";
import { CMTFetch } from "../../../utils/api";
import { OutputRenderer } from "../OutputRenderer";
import { Button } from "react-bootstrap";

/**
 * Barebones output renderer, meant to be extended by other action renderers
 */
export function GenericActionRenderer({ metadata, outputValues, setOutputValues }) {
    return (
        <>
            {metadata.outputs.map(output => (
                <OutputRenderer
                    output={output}
                    value={outputValues[output.key]}
                    setValue={value => setOutputValues(prevValues => ({ ...prevValues, [output.key]: value }))}
                />
            ))}
        </>
    )
}


export function CheckmarkActionRenderer({ actionWithContext, refresh }) {
    const checked = actionWithContext.actionState.stateType === "completed";
    
    const submit = useCallback(newChecked =>  
        void CMTFetch("PUT", actionWithContext.callback, { stateType: newChecked ? "completed" : "notStarted" }).then(refresh),
        [actionWithContext.callback, refresh]
    );
    
    return (
        <Button
            variant={checked ? "outline-secondary" : "primary"}
            onClick={e => {
                e.stopPropagation()
                submit(!checked)
            }}
        >
            {checked ? "Mark as Incomplete" : "Mark as Complete"}
        </Button>
    );
}
