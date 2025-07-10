export default function ActionState({ action, setAction }) {

    // const url = process.env.SERVER_URL || "http://localhost:3001"

    const url = "http://localhost:3001";

    function handlePrevious() {
        fetch(`${url}/actions/${action.previous_action.id}`, {
            method: 'GET'
        }).then((res) => {
            return res.json();
        }).then((previousAction) => {
            setAction(previousAction);
        })
    }

    function handleNext() {
        fetch(`${url}/actions/${action.next_action_id}`, {
            method: 'GET'
        }).then((res) => {
            return res.json();
        }).then((nextAction) => {
            setAction(nextAction);
        })
    }

    return (
        <div className="flow flow-col gap-2 p-2">
            <div className="grid grid-cols-3 items-center justify-between border-b py-2 mb-4">
                <div className="flex flex-row gap-2 items-center justify-start h-full pl-4">
                    <button onClick={handlePrevious} className="border p-2 rounded-sm min-w-24 text-center hover:bg-gray-300">{"< Previous"}</button>
                </div>
                <h2 className="text-lg font-bold text-center">{"Name: " + action?.name}</h2>
                <div className="flex flex-row gap-2 items-center justify-end h-full pr-4">
                    <button onClick={handleNext} className="border p-2 rounded-sm min-w-24 text-center hover:bg-gray-300">{"Next >"}</button>
                </div>
            </div>
            <p>{"Description: " + action?.description}</p>

            {/* Should really figure out something better than dangerouslySetInnerHTML, or this form stuff */}
            <div dangerouslySetInnerHTML={{ __html: action?.form }} />
        </div>
    )
}