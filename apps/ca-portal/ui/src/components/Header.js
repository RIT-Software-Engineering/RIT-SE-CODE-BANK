export default function Header(){
    return (

        // Add childen prop to allow passing components inside header eg links
        <div class="bg-rit-orange p-4">
            <div id="Logo" class="text-left pl-10">
                <h1 className="text-4xl font-bold">Course Assistant Portal</h1>
                <h3>Department of software engineering, RIT </h3>
            </div>
        </div>
    )
}