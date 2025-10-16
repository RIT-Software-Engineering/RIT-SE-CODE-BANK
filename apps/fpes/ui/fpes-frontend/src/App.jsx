import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ServicesPage from './pages/services/ServicesPage.jsx';
import GrantsTable from './pages/grants';
import DepartmentsPage from './pages/departments/DepartmentsPage.jsx';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>FPES Portal</h1>
      <BrowserRouter>
        <nav>
          <Link to="/services">Services</Link>
        </nav>
        <nav>
          <Link to="/grants">Grants</Link>
        </nav>
        <nav>
          <Link to="/departments">Departments</Link>
        </nav>

        <Routes>
          <Route path="/services" element={<ServicesPage/>} />
          <Route path="/grants" element={<GrantsTable />} />
          <Route path="/departments" element={<DepartmentsPage/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
