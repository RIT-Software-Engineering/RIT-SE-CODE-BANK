import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ServicesPage from './pages/services/ServicesPage.jsx';
import GrantsTable from './pages/grants';
import DepartmentsPage from './pages/departments/DepartmentsPage.jsx';
import CourseSectionsPage from './pages/course_sections/CourseSectionsPage.jsx';
import { FormControl, FormLabel, InputLabel, MenuItem, Select } from '@mui/material';

function App() {
  const [role, setRole] = useState("guest")

  const adminLinks = (
    <>
    <Link to="/departments">Departments   </Link>
    <Link to="/course_sections">Course Sections</Link>
    </>
  )

  const adminRoutes = (
    <>
    <Route path="/departments" element={<DepartmentsPage/>} />
    <Route path="/course_sections" element={<CourseSectionsPage/>} />
    </>
  )

  return (
    <div>
      <div>
        <FormControl sx={{display:'grid', justifyItems:'left'}}>
          <InputLabel id="role_view_label">View</InputLabel>
          <Select labelId="role_view_label" label="View" defaultValue={"guest"} onChange={(e) => setRole(e.target.value)}>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="guest">Guest</MenuItem>
          </Select>
        </FormControl>
      </div>
      <h1>FPES Portal</h1>
      <BrowserRouter>
        <nav>
          <Link to="/services">Services   </Link>
          <Link to="/grants">Grants   </Link>
          {role === 'admin' ? adminLinks : null}
        </nav>

        <Routes>
          <Route path="/services" element={<ServicesPage/>} />
          <Route path="/grants" element={<GrantsTable />} />
          {role === 'admin' ? adminRoutes : null}
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
