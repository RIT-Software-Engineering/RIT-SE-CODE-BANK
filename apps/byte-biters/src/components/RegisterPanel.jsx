import Register from "./Register";

export default function RegisterPanel () {
    return (
        <div className="bg-main-secondary h-24 flex flex-col items-center justify-between py-4 gap-4">
            <div className="flex flex-row gap-8">
                <Register name="R0" number="000"></Register>
                <Register name="R1"></Register>
                <Register name="R2"></Register>
                <Register name="R3"></Register>
                <Register name="R4"></Register>
                <Register name="R5"></Register>
            </div>
            {/* special registers */}
            <div className="flex flex-row gap-8">
                <Register name="SP"></Register>
                <Register name="PC"></Register>
                <Register name="SR"></Register>
            </div>
            
        </div>
    )
}