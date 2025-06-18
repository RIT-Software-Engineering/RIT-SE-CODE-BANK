import "../styles/pages/ProfilePage.css";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ProfilePage() {
    return (
        <>
            <Header />
            <main className="profile">
                <h1>Profile Page</h1>
                <p>This is where user profile information will be displayed.</p>
            </main>
            <Footer />
        </>
    );
}