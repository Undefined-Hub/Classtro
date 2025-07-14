import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Landing from './pages/Landing'
import Login from './pages/Login'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import JoinSession from './pages/JoinSession'
function App() {

  return (
    <> 
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/join" element={<JoinSession />} />
          {/* Add more routes here as needed */}
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
