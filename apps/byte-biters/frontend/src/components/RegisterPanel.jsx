import React from "react"
import Register from "./Register";

function RegisterPanel ({ registers }) {
    return (
        <div className="bg-main-secondary h-24 flex flex-col items-center justify-between py-4 gap-4">
            <div className="flex flex-row gap-8">
                {registers.slice(0,6).map((reg, i) => (
                    <Register key={i} name={`R${i}`} value={reg.toString().padStart(4, "0")}/>
                ))}
            </div>
            {/* special registers */}
            <div className="flex flex-row gap-8">
                <Register key="sp" name="SP" value={registers[6].toString().padStart(4, "0")}/>
                <Register key="pc" name="PC" value={registers[7].toString().padStart(4, "0")}/>
                <Register name="SR"></Register>
            </div>
            
        </div>
    )
}
export default React.memo(RegisterPanel)