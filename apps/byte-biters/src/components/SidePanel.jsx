import Dropdown from "./Dropdown";

//where logs, inputs, and outputs will go
export default function SidePanel(){
    return (
        <div className="bg-main-primary min-w-0 flex flex-col flex-1 overflow-auto">
            <Dropdown name="Input"></Dropdown>
            <Dropdown name="Output"></Dropdown>
{/*             doesnt work yet
            <image src="assets/play.png"></image> */}
        </div>
    )
}