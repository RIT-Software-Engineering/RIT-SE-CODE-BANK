import "./App.css";
import Landing from "./pages/Landing";
import { Routes, Route, Link } from "react-router";
import Messaging from "./pages/Messaging";
import Users from "./pages/Users";
import Header from "./components/Header";
import Timecard from './pages/Timecard';

function App() {
  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/users" element={<Users />} />
        <Route path="/timecard" element={<Timecard/>} />
        <Route path="/users/:userId/messaging" element={<Messaging />} />
        <Route path="/messaging" element={<Messaging />} />
      </Routes>
    </div>
  );
}


export default App;
