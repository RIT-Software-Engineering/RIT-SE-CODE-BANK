import React from "react"
import Register from "./Register";
//register panel component, holds all the registers including specical ones
function RegisterPanel ({ registers, flags }) {
    return (
        <div className="bg-main-secondary flex flex-col items-center justify-between py-4 gap-4">
            {/* normal registers */}
            <div className="flex flex-row gap-8">
                {registers.slice(0,6).map((reg, i) => (
                    <Register key={i} name={`R${i}`} value={reg.toString().padStart(4, "0")}/>
                ))}
            </div>
            {/* special registers */}
            <div className="flex flex-row gap-8">
                {/* stack pointer */}
                <Register key="sp" name="SP" value={registers[6].toString().padStart(4, "0")}/>
                {/* program counter */}
                <Register key="pc" name="PC" value={registers[7].toString().padStart(4, "0")}/>
                <div className="flex flex-row items-center">
                    {/* status register */}
                    <p className="pr-2 font-bold">SR:</p>
                    {/* deals with the different flags for the status register */}
                    <div className="flex gap-2 flex-row bg-main-secondary border-border-secondary rounded-sm border-2 p-1 px-3 font-mono">
                        {/* N for negative, Z for zero, V for overload, C for carry */}
                        {["N ", "Z ", "V ", "C "].map((flag) => (
                        <div key={flag} className="flex flex-row items-center">
                            <span className="text-xs text-gray-400">{flag} </span>
                                <span className={
                                    flags?.[flag]
                                    ? "text-button-default font-bold" //text is bright white when flag is active
                                    : "text-gray-500" } /*greyed out otherwise*/ >
                                {flags?.[flag] ? " 1" : " 0"} {/*1 for active, 0 for inactive */}
                            </span>
                        </div> ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
export default React.memo(RegisterPanel)