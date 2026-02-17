//header, includes the add file and external resources buttons/links
export default function Header() {
    return (
        <div>
        <div className="p-6 flex bg-main-primary min-h-20 justify-between">
            {/* placeholders */}
            <button className="font-mono text-text-muted text-lg text-center">Add File! +</button>
            <button className="font-mono text-text-muted text-lg"> External Resources</button>
        </div>
        <div className="bg-border-primary min-h-4"></div>
        </div>
    )

}