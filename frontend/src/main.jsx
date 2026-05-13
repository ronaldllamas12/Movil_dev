// main monta la app en el dom, es el punto de entrada de la aplicación.
import { StrictMode } from 'react'
// import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client'
import {CarritoProvider} from './context/CarritoContext.jsx';
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CarritoProvider> {/* 1. Envolvemos la app en el CarritoProvider para que toda la app tenga acceso al contexto */}
      <BrowserRouter> {/* 2. Envolvemos la app en el BrowserRouter */}
      <App />
      </BrowserRouter>
    </CarritoProvider>
  </StrictMode>,
)
