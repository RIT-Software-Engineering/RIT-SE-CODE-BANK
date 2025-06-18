import "../styles/pages/HomePage.css"

import Footer from "../components/Footer";
import Header from "../components/Header";

export default function HomePage() {
    return (
        <>
            <Header />
            <main className="home">
                <h1>Welcome to Rubricon!</h1>
                <p>
                    This is the homepage, where user's who are not authenticated will be routed. It will
                    showcase the core purpose of the application, and maybe some of the added features.
                </p>
            </main>
            <Footer />
        </>
    )
}