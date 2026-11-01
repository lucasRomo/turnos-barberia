import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Sitio from './sitio/Sitio'
import Reservar from './sitio/Reservar'
import Layout from './admin/Layout'
import Hoy from './admin/Hoy'
import Agenda from './admin/Agenda'
import Clientes from './admin/Clientes'
import Caja from './admin/Caja'
import Reportes from './admin/Reportes'
import { Ajustes, Equipo, Servicios } from './admin/Catalogo'
import './sitio/sitio.css'
import './admin/admin.css'

// HashRouter: así funciona en GitHub Pages sin configurar el servidor.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Sitio />} />
        <Route path="/reservar" element={<Reservar />} />
        <Route path="/admin" element={<Layout />}>
          <Route index element={<Hoy />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="caja" element={<Caja />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="servicios" element={<Servicios />} />
          <Route path="equipo" element={<Equipo />} />
          <Route path="ajustes" element={<Ajustes />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
