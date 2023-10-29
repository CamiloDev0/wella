import React from 'react'
import ReactDOM from 'react-dom/client'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
