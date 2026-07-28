import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Archivo carries the instrument lettering (weight + width axes); IBM Plex
// Mono, from the house that built the Selectric, carries everything typed.
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import { App } from './App'
import './styles/app.css'

const container = document.getElementById('root')
if (container === null) throw new Error('Missing #root element')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
)
