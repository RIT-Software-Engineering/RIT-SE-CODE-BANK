export default async function ActionState({ actionId }) {

    // const url = process.env.SERVER_URL || "http://localhost:3001"

    const url = "http://localhost:3001";

    // Name and Description should be defined for every action.
    const nameData = await fetch(url + "/metadata?key=name&actionId=" + actionId, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const name = (await nameData.json())[0];

    const descriptionData = await fetch(url + "/metadata?key=description&actionId=" + actionId, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const description = (await descriptionData.json())[0];

    const formData = await fetch(url + "/metadata?key=form&actionId=" + actionId, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const form = (await formData.json())[0];

    return (
        <div className="flow flow-col gap-2 border border-solid border-black rounded-md p-2">
            <div className="grid grid-cols-3 items-center justify-between border-b py-2 mb-4">
                <div className="flex flex-row gap-2 items-center justify-start h-full pl-4">
                    <button className="border p-2 rounded-sm min-w-24 text-center hover:bg-gray-300">{"< Previous"}</button>
                </div>
                <h2 className="text-lg font-bold text-center">{"Name: " + name.value}</h2>
                <div className="flex flex-row gap-2 items-center justify-end h-full pr-4">
                    <button className="border p-2 rounded-sm min-w-24 text-center hover:bg-gray-300">{"Next >"}</button>
                </div>
            </div>
            <p>{"Description: " + description.value}</p>
            {form.value}
        </div>
    )
}