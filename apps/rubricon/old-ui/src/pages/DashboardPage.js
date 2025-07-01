import "../styles/pages/DashboardPage.css";

import RubricList from "../components/RubricList";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function DashboardPage() {

  // When dashboard loads, check who is currently signed in
  // This is currently implemented backwards. Normally the cookie is set by passport.authenticate,
  // then this function would pull that user from the server.
  // useEffect(() => {
  // setUser({
  //   user: 1,
  // });

  document.cookie = "system_id=1";
  
  // sessionStorage.setItem("system_id", 1)
  // });


  return (
    <>
      <Header />
      <main className="App-main dashboard">
        <div className="dashboard-hero">
          <h1>Dashboard</h1>
          {/* <p>{"Welcome User: " + user.user}</p> */}
          <div className="dashboard-toolbar">
            <Link to="/create" className="dashboard-toolbar-item router-link">Create New Rubric</Link>
            <Link className="dashboard-toolbar-item router-link">Import Rubric</Link>
            <Link className="dashboard-toolbar-item router-link">Export Rubric</Link>
          </div>
        </div>
        <RubricList />
        {/* Future components like RubricList, Analytics, etc. can be added here */}
      </main>
      <Footer />
    </>
  );
}