import Header from "@components/Header";

export default function ProjectDetailsLayout({ children }) {
    return (
        <div>
            <Header />
            {children}
        </div>
    );
}
