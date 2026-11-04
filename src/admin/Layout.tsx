import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, CalendarDays, Clock, Globe, Menu, Plus, RotateCcw, Scissors, Search, Settings, Users, Wallet, UserRound } from 'lucide-react'
import { negocio } from '../config/negocio'
import { aMin, ahoraMin, hoyClave } from '../lib/formato'
import { franjas, reiniciarDemo, useDemo } from '../lib/store'
import { PRODUCTO } from '../sitio/comun'
import { Logo } from '../lib/ui'
import { DetalleTurno, NuevoTurno, type Alcance, type Contexto, type NuevoTurnoDatos } from './comun'

const menu = [
  { a: '/admin', texto: 'Hoy', icono: Clock, fin: true },
  { a: '/admin/agenda', texto: 'Agenda', icono: CalendarDays },
  { a: '/admin/clientes', texto: 'Clientes', icono: Users },
  { a: '/admin/caja', texto: 'Caja', icono: Wallet },
  { a: '/admin/reportes', texto: 'Reportes', icono: BarChart3 },
  { a: '/admin/servicios', texto: 'Servicios y precios', icono: Scissors },
  { a: '/admin/equipo', texto: 'Equipo', icono: UserRound },
  { a: '/admin/ajustes', texto: 'Reservas online', icono: Settings },
]

export default function Layout() {
  const e = useDemo()
  const [alcance, setAlcance] = useState<Alcance>('todas')
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [nuevo, setNuevo] = useState<NuevoTurnoDatos | null>(null)
  const [turno, setTurno] = useState<string | null>(null)
  const [buscar, setBuscar] = useState('')
  const lugar = useLocation()
  const ir = useNavigate()

  useEffect(() => {
    document.title = `Panel · ${negocio.nombre}`
    setMenuAbierto(false)
  }, [lugar.pathname])

  const ctx: Contexto = useMemo(
    () => ({
      alcance,
      verTurno: setTurno,
      nuevoTurno: (p) => {
        const sucursal = p?.sucursal ?? (alcance === 'todas' ? negocio.sucursales[0].id : alcance)
        const dia = p?.dia ?? hoyClave()
        const fr = franjas(sucursal, dia)
        const ahora = Math.ceil(ahoraMin() / 30) * 30
        const apertura = fr.length ? aMin(fr[0][0]) : 600
        setNuevo({
          sucursal,
          dia,
          inicio: p?.inicio ?? (dia === hoyClave() ? Math.max(ahora, apertura) : apertura),
          barberoId: p?.barberoId ?? e.equipo.find((b) => b.sucursal === sucursal)!.id,
          servicioId: p?.servicioId ?? 'corte',
        })
      },
    }),
    [alcance, e.equipo],
  )

  const coincidencias = buscar.length > 1 ? e.clientes.filter((c) => c.nombre.toLowerCase().includes(buscar.toLowerCase())).slice(0, 6) : []

  return (
    <div className="admin">
      <aside className={`lateral ${menuAbierto ? 'lateral-abierta' : ''}`}>
        <div className="producto">
          <Logo tamaño={34} />
          <span>
            <strong>{negocio.nombre}</strong>
            <small>Panel · {negocio.ciudad}</small>
          </span>
        </div>
        <label className="alcance">
          <span className="oculto">Sucursal</span>
          <select value={alcance} onChange={(ev) => setAlcance(ev.target.value as Alcance)}>
            <option value="todas">Las dos sucursales</option>
            {negocio.sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </label>
        <nav className="menu">
          {menu.map(({ a, texto, icono: Icono, fin }) => (
            <NavLink key={a} to={a} end={fin}>
              <Icono size={17} strokeWidth={1.8} aria-hidden="true" />
              {texto}
            </NavLink>
          ))}
        </nav>
        <div className="lateral-pie">
          <NavLink to="/" className="menu-secundario"><Globe size={16} strokeWidth={1.8} aria-hidden="true" /> Ver la web de turnos</NavLink>
          <button className="menu-secundario" onClick={() => { reiniciarDemo(); ir('/admin') }}>
            <RotateCcw size={16} strokeWidth={1.8} aria-hidden="true" /> Reiniciar demo
          </button>
          <div className="usuario">
            <span className="persona persona-dueño" aria-hidden="true">{negocio.dueño.slice(0, 2).toUpperCase()}</span>
            <span>
              <strong>{negocio.dueño}</strong>
              <small>Dueño</small>
            </span>
          </div>
          <p className="hecho-con">Hecho con {PRODUCTO}</p>
        </div>
      </aside>
      <header className="superior">
        <button className="btn-icono solo-telefono" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Menú">
          <Menu size={20} />
        </button>
        <div className="buscador">
          <Search size={16} className="buscador-icono" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar cliente por nombre"
            value={buscar}
            onChange={(ev) => setBuscar(ev.target.value)}
            aria-label="Buscar cliente"
          />
          {coincidencias.length > 0 && (
            <ul className="sugerencias">
              {coincidencias.map((c) => (
                <li key={c.id}>
                  <button onClick={() => { setBuscar(''); ir(`/admin/clientes?id=${c.id}`) }}>
                    {c.nombre} <small>{c.telefono}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button className="boton boton-primario" onClick={() => ctx.nuevoTurno()}><Plus size={16} strokeWidth={2.4} aria-hidden="true" /> Nuevo turno</button>
      </header>
      <main className="hoja-admin">
        <Outlet context={ctx} />
      </main>
      <NuevoTurno datos={nuevo} cerrar={() => setNuevo(null)} />
      <DetalleTurno id={turno} cerrar={() => setTurno(null)} />
    </div>
  )
}
