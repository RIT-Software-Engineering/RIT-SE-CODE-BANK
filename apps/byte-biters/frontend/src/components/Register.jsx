export default function Register({name, value = "0000"}) {
    return (
        <div>
            <text className="pr-2 font-bold">{name}:</text>
            <text className="bg-main-secondary border-border-secondary rounded-sm border-2 p-1 px-2">{value}</text>
        </div>
    )
}