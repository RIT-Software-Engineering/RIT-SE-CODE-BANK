import './App.css';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import RubricsPage from './pages/RubricsPage';
import RubricPage from './pages/RubricPage';
import CreatePage from './pages/CreatePage';
import EditPage from './pages/EditPage';
// import { UserContextProvider } from './utils/UserContext';
import { Route, Routes } from 'react-router-dom';

function App() {
  return (
    // <UserContextProvider>
      <div className="App">
        <Routes>
          <Route path="/" Component={HomePage} exact />
          <Route path="/dashboard" Component={DashboardPage} />
          <Route path="/profile" Component={ProfilePage} />
          <Route path="/rubrics" Component={RubricsPage} />
          <Route path="/rubrics/:id" Component={RubricPage} />
          <Route path="/create" Component={CreatePage} />
          <Route path="/edit/:id" Component={EditPage} />
        </Routes>
      </div>
    // </UserContextProvider>
  );
}

export default App;
