import Dropdown from "./Dropdown";

//where logs, inputs, and outputs will go
export default function SidePanel(){
    return (
        //placeholder, does not work yet
        <div className="bg-main-primary min-w-0 flex flex-col flex-1 overflow-auto">
            <Dropdown name="Input"></Dropdown>
            <Dropdown name="Output"></Dropdown>
        </div>
    )
}