import Image from "next/image";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Home() {
    return (
        <div>
            <Header />
            <main>
                <h1>Welcome to the New SCOOP Portal.</h1>
            </main>
            <Footer />
        </div>
    );
}
