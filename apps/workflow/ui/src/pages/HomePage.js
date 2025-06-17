import Header from "../components/Header"
import Footer from "../components/Footer"

export default function HomePage() {
    return (
        <div>
            <Header />
            <h1>Welcome to the Workflows App</h1>
            <p>
                This application is responsible for providing users at rit with the ability to create, manage, 
                and complete workflows.
            </p>
            <Footer />
        </div>
    )
}