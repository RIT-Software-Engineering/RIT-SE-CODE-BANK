import '../styles/pages/RubricsPage.css';

import Header from '../components/Header';
import Footer from '../components/Footer';
import RubricList from '../components/RubricList';

export default function RubricsPage() {
    return (
        <>
            <Header />
            <main className="rubrics">
                <h1>Rubrics Page</h1>
                <p>This is where the list of rubrics will be displayed.</p>
                <RubricList />
            </main>
            <Footer />
        </>
    );
}