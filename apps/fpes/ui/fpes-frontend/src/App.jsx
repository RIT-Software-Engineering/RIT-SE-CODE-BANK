import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ServicesPage from './pages/services_page';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>HEADER</h1>
      <BrowserRouter>
        <nav>
          <Link to="/services">Services</Link>
        </nav>

        <Routes>
          <Route path="/services" element={<ServicesPage/>} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
