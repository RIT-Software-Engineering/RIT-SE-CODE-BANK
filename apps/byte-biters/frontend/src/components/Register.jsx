export default function Register({name, value = "0000"}) {
    return (
        <div className="flex flex-row">
            <p className="pr-2 font-bold">{name}:</p>
            <p className="bg-main-secondary border-border-secondary rounded-sm border-2 p-1 px-2">{value}</p>
        </div>
    )
}