import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import Bootstrap CSS (and optionally JS for interactive elements like modals/dropdowns)
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)