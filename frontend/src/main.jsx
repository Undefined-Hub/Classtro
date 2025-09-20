import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx'
import { AuthProvider } from './context/UserContext.jsx'
import { ParticipantSessionProvider } from './context/ParticipantSessionContext.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ParticipantSessionProvider>
          <App />
        </ParticipantSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
