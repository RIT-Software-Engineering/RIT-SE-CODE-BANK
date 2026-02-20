import Dropdown from "./Dropdown";

//where logs, inputs, and outputs will go
export default function SidePanel(){
    return (
        <div className="bg-main-primary w-96">
            <Dropdown name="Input"></Dropdown>
            <Dropdown name="Output"></Dropdown>
{/*             doesnt work yet
            <image src="assets/play.png"></image> */}
        </div>
    )
}