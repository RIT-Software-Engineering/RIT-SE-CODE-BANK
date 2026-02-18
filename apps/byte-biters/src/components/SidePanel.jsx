import Dropdown from "./Dropdown";

//where logs, inputs, and outputs will go
export default function SidePanel(){
    return (
        //temp color for better testing visuals
        <div className="bg-blue-900 w-96">
            <Dropdown name="Input"></Dropdown>
            <Dropdown name="Output"></Dropdown>
        </div>
    )
}