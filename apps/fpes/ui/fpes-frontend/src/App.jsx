import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ServicesPage from './pages/services/ServicesPage.jsx';
import GrantsTable from './pages/grants/grantsPage.jsx';
import DepartmentsPage from './pages/departments/DepartmentsPage.jsx';
import CourseSectionsPage from './pages/course_sections/CourseSectionsPage.jsx';
import { FormControl, FormLabel, InputLabel, MenuItem, Select } from '@mui/material';
import StudentSupportPage from './pages/student_support/StudentSupportPage.jsx';
import CoursesPage from './pages/courses/CoursePage.jsx'

function App() {
  const [role, setRole] = useState("guest")

  const adminLinks = (
    <>
    <Link to="/departments">Departments   </Link>
    <Link to="/course_sections">Course Sections   </Link>
    </>
  )

  const adminRoutes = (
    <>
    <Route path="/departments" element={<DepartmentsPage/>} />
    <Route path="/course_sections" element={<CourseSectionsPage/>} />
    <Route path="/courses" element={<CoursesPage />} />
    </>
  )

  return (
    <div>
      <div>
        <FormControl sx={{display:'grid', justifyItems:'left'}}>
          <InputLabel id="role_view_label">View</InputLabel>
          <Select labelId="role_view_label" label="View" defaultValue={"guest"} onChange={(e) => setRole(e.target.value)}>
            <MenuItem value="admin">Admin   </MenuItem>
            <MenuItem value="guest">Guest   </MenuItem>
          </Select>
        </FormControl>
      </div>
      <h1>FPES Portal</h1>
      <BrowserRouter>
        <nav>
          <Link to="/services">Services   </Link>
          <Link to="/grants">Grants   </Link>
          {role === 'admin' ? adminLinks : null}
          <Link to="/student_support">Student Support   </Link>
          <Link to="/courses">Courses   </Link>
        </nav>

        <Routes>
          <Route path="/services" element={<ServicesPage/>} />
          <Route path="/grants" element={<GrantsTable />} />
          {role === 'admin' ? adminRoutes : null}
          <Route path="/student_support" element={<StudentSupportPage/>} />
          <Route path="/courses" element={<CoursesPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
