import './App.css';
import HomePage from './pages/HomePage';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div id="page">
      <Routes>
        <Route path="/" component={HomePage} exact />
      </Routes>
    </div>
  );
}

export default App;
