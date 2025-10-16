import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ServicesPage from './pages/services/ServicesPage.jsx';
import GrantsTable from './pages/grants';
import DepartmentsPage from './pages/departments/DepartmentsPage.jsx';
import CourseSectionsPage from './pages/course_sections/CourseSectionsPage.jsx';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>FPES Portal</h1>
      <BrowserRouter>
        <nav>
          <Link to="/services">Services   </Link>
          <Link to="/grants">Grants   </Link>
          <Link to="/departments">Departments   </Link>
          <Link to="/course_sections">Course Sections</Link>
        </nav>

        <Routes>
          <Route path="/services" element={<ServicesPage/>} />
          <Route path="/grants" element={<GrantsTable />} />
          <Route path="/departments" element={<DepartmentsPage/>} />
          <Route path="/course_sections" element={<CourseSectionsPage/>} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
