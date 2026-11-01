import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { negocio, type Servicio } from '../config/negocio'
import { duracion, hoyClave, pesos, sumarDias } from '../lib/formato'
import { actualizarBarbero, actualizarProducto, actualizarServicio, agregarServicio, useDemo } from '../lib/store'
import { Dialogo } from '../lib/ui'
import { Persona } from './comun'

// ——— Servicios y precios ———

export function Servicios() {
  const e = useDemo()
  const [editar, setEditar] = useState<Servicio | 'nuevo' | null>(null)
  const [aumento, setAumento] = useState(false)
  const desde = sumarDias(hoyClave(), -29)
  const usados = useMemo(() => {
    const m: Record<string, number> = {}
    e.turnos.forEach((t) => t.dia >= desde && t.estado === 'atendido' && (m[t.servicioId] = (m[t.servicioId] ?? 0) + 1))
    return m
  }, [e.turnos, desde])

  return (
    <div className="pantalla">
      <div className="titulo-fila">
        <div>
          <h1>Servicios y precios</h1>
          <p>Lo que cambies acá se ve al instante en la web de turnos.</p>
        </div>
        <div className="acciones-fila">
          <button className="boton" onClick={() => setAumento(true)}>Aumentar precios</button>
          <button className="boton boton-primario" onClick={() => setEditar('nuevo')}>Nuevo servicio</button>
        </div>
      </div>
      <table className="tabla">
        <thead>
          <tr><th>Servicio</th><th>Tipo</th><th className="num">Duración</th><th className="num">Precio</th><th className="num">Últimos 30 días</th><th>En la web</th><th /></tr>
        </thead>
        <tbody>
          {e.servicios.map((s) => (
            <tr key={s.id}>
              <td><strong>{s.nombre}</strong><small>{s.descripcion}</small></td>
              <td>{s.grupo}</td>
              <td className="num">{duracion(s.duracion)}</td>
              <td className="num">{pesos(s.precio)}</td>
              <td className="num">{usados[s.id] ?? 0} turnos</td>
              <td>
                <label className="interruptor">
                  <input type="checkbox" checked={s.online} onChange={(ev) => actualizarServicio(s.id, { online: ev.target.checked })} />
                  <span>{s.online ? 'Visible' : 'Oculto'}</span>
                </label>
              </td>
              <td className="num"><button className="boton boton-chico" onClick={() => setEditar(s)}>Editar</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="subtitulo">Productos en venta</h2>
      <table className="tabla">
        <thead><tr><th>Producto</th><th className="num">Precio</th><th className="num">Stock</th></tr></thead>
        <tbody>
          {e.productos.map((p) => (
            <tr key={p.id}>
              <td><strong>{p.nombre}</strong></td>
              <td className="num">{pesos(p.precio)}</td>
              <td className="num">
                <span className="stock">
                  <button className="boton boton-chico" onClick={() => actualizarProducto(p.id, { stock: Math.max(0, p.stock - 1) })} aria-label={`Restar stock de ${p.nombre}`}>−</button>
                  <span className={p.stock <= 4 ? 'mal' : ''}>{p.stock} u.</span>
                  <button className="boton boton-chico" onClick={() => actualizarProducto(p.id, { stock: p.stock + 1 })} aria-label={`Sumar stock de ${p.nombre}`}>+</button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialogo abierto={!!editar} cerrar={() => setEditar(null)} titulo={editar === 'nuevo' ? 'Nuevo servicio' : 'Editar servicio'}>
        {editar && <FormServicio s={editar === 'nuevo' ? null : editar} cerrar={() => setEditar(null)} />}
      </Dialogo>
      <Dialogo abierto={aumento} cerrar={() => setAumento(false)} titulo="Aumentar todos los precios">
        {aumento && <FormAumento cerrar={() => setAumento(false)} />}
      </Dialogo>
    </div>
  )
}

function FormServicio({ s, cerrar }: { s: Servicio | null; cerrar: () => void }) {
  const [d, setD] = useState<Servicio>(
    s ?? { id: `s${Date.now()}`, nombre: '', descripcion: '', grupo: 'Corte', precio: 15000, duracion: 30, online: true },
  )
  function guardar(ev: FormEvent) {
    ev.preventDefault()
    if (s) actualizarServicio(s.id, d)
    else agregarServicio(d)
    cerrar()
  }
  return (
    <form className="formulario" onSubmit={guardar}>
      <label className="campo">Nombre<input required value={d.nombre} onChange={(ev) => setD({ ...d, nombre: ev.target.value })} /></label>
      <label className="campo">Descripción<input value={d.descripcion} onChange={(ev) => setD({ ...d, descripcion: ev.target.value })} /></label>
      <div className="campos-2">
        <label className="campo">Precio<input inputMode="numeric" value={d.precio} onChange={(ev) => setD({ ...d, precio: Number(ev.target.value.replace(/\D/g, '')) })} /></label>
        <label className="campo">
          Duración
          <select value={d.duracion} onChange={(ev) => setD({ ...d, duracion: Number(ev.target.value) })}>
            {[15, 20, 30, 45, 60, 90, 120, 180, 240, 300].map((m) => <option key={m} value={m}>{duracion(m)}</option>)}
          </select>
        </label>
        <label className="campo">
          Tipo
          <select value={d.grupo} onChange={(ev) => setD({ ...d, grupo: ev.target.value as Servicio['grupo'] })}>
            <option>Corte</option><option>Barba</option><option>Color</option>
          </select>
        </label>
      </div>
      <div className="acciones-fila">
        <button type="button" className="boton" onClick={cerrar}>Cancelar</button>
        <button className="boton boton-primario">Guardar</button>
      </div>
    </form>
  )
}

function FormAumento({ cerrar }: { cerrar: () => void }) {
  const e = useDemo()
  const [p, setP] = useState(10)
  const redondear = (n: number) => Math.round(n / 500) * 500
  return (
    <form className="formulario" onSubmit={(ev) => { ev.preventDefault(); e.servicios.forEach((s) => actualizarServicio(s.id, { precio: redondear(s.precio * (1 + p / 100)) })); cerrar() }}>
      <label className="campo">
        Porcentaje de aumento
        <input type="number" min={1} max={100} value={p} onChange={(ev) => setP(Number(ev.target.value))} />
      </label>
      <ul className="lista-simple">
        {e.servicios.map((s) => (
          <li key={s.id}><span>{s.nombre}</span><span>{pesos(s.precio)} → <strong>{pesos(redondear(s.precio * (1 + p / 100)))}</strong></span></li>
        ))}
      </ul>
      <p className="ayuda">Se redondea a los $500. Los turnos ya reservados mantienen su precio.</p>
      <div className="acciones-fila">
        <button type="button" className="boton" onClick={cerrar}>Cancelar</button>
        <button className="boton boton-primario">Aplicar aumento</button>
      </div>
    </form>
  )
}

// ——— Equipo ———

export function Equipo() {
  const e = useDemo()
  const hoy = hoyClave()
  const mes = hoy.slice(0, 7)
  return (
    <div className="pantalla">
      <div className="titulo-fila">
        <div>
          <h1>Equipo</h1>
          <p>{e.equipo.length} barberos en {negocio.sucursales.length} sucursales · números de {new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(new Date())}</p>
        </div>
      </div>
      <table className="tabla">
        <thead>
          <tr><th>Barbero</th><th>Sucursal</th><th className="num">Turnos del mes</th><th className="num">Facturado</th><th className="num">Comisión</th><th className="num">A pagar</th></tr>
        </thead>
        <tbody>
          {e.equipo.map((b) => {
            const suyos = e.turnos.filter((t) => t.barberoId === b.id && t.dia.startsWith(mes) && t.estado === 'atendido')
            const total = suyos.reduce((s, t) => s + t.precio, 0)
            return (
              <tr key={b.id}>
                <td><span className="con-persona"><Persona b={b} /> <span><strong>{b.nombre}</strong><small>Desde {b.desde}</small></span></span></td>
                <td>{negocio.sucursales.find((s) => s.id === b.sucursal)!.nombre}</td>
                <td className="num">{suyos.length}</td>
                <td className="num">{pesos(total)}</td>
                <td className="num">
                  <select className="select-chico" value={b.comision} onChange={(ev) => actualizarBarbero(b.id, { comision: Number(ev.target.value) })} aria-label={`Comisión de ${b.nombre}`}>
                    {[30, 35, 40, 45, 50, 55, 60].map((c) => <option key={c} value={c}>{c}%</option>)}
                  </select>
                </td>
                <td className="num"><strong>{pesos(Math.round((total * b.comision) / 100))}</strong></td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="ayuda">Las comisiones se calculan sobre los turnos cobrados del mes en curso. Para ver otros períodos, andá a <Link to="/admin/reportes">Reportes</Link>.</p>
    </div>
  )
}

// ——— Reservas online ———

export function Ajustes() {
  const [anticipacion, setAnticipacion] = useState('20')
  const [ventana, setVentana] = useState('14')
  const [recordatorio, setRecordatorio] = useState(true)
  const [cancelar, setCancelar] = useState('2')
  const [guardado, setGuardado] = useState(false)
  const url = `${location.origin}${location.pathname}#/`
  return (
    <div className="pantalla pantalla-angosta">
      <div className="titulo-fila">
        <div>
          <h1>Reservas online</h1>
          <p>Cómo sacan turno tus clientes desde la web y el link de Instagram.</p>
        </div>
      </div>
      <form className="ajustes" onSubmit={(ev) => { ev.preventDefault(); setGuardado(true); setTimeout(() => setGuardado(false), 2400) }}>
        <div className="ajuste">
          <div><h2>Tu link de turnos</h2><p>Ponelo en la bio de Instagram y en el estado de WhatsApp.</p></div>
          <div className="ajuste-control">
            <input readOnly value={url} onFocus={(ev) => ev.target.select()} aria-label="Link de turnos" />
            <Link className="boton boton-chico" to="/">Abrir</Link>
          </div>
        </div>
        <div className="ajuste">
          <div><h2>Anticipación mínima</h2><p>Cuánto antes tiene que reservar el cliente.</p></div>
          <select value={anticipacion} onChange={(ev) => setAnticipacion(ev.target.value)} aria-label="Anticipación mínima">
            <option value="0">Sin mínimo</option><option value="20">20 minutos</option><option value="60">1 hora</option><option value="180">3 horas</option>
          </select>
        </div>
        <div className="ajuste">
          <div><h2>Hasta cuándo se puede reservar</h2><p>Días hacia adelante que muestra la agenda.</p></div>
          <select value={ventana} onChange={(ev) => setVentana(ev.target.value)} aria-label="Ventana de reserva">
            <option value="7">7 días</option><option value="14">14 días</option><option value="30">30 días</option>
          </select>
        </div>
        <div className="ajuste">
          <div><h2>Cancelación</h2><p>Hasta cuántas horas antes puede cancelar el cliente sin avisar.</p></div>
          <select value={cancelar} onChange={(ev) => setCancelar(ev.target.value)} aria-label="Cancelación">
            <option value="1">1 hora</option><option value="2">2 horas</option><option value="24">24 horas</option>
          </select>
        </div>
        <div className="ajuste">
          <div><h2>Recordatorio por WhatsApp</h2><p>Se manda solo el día anterior al turno. Baja mucho los que no vienen.</p></div>
          <label className="interruptor">
            <input type="checkbox" checked={recordatorio} onChange={(ev) => setRecordatorio(ev.target.checked)} />
            <span>{recordatorio ? 'Activado' : 'Apagado'}</span>
          </label>
        </div>
        <div className="ajuste">
          <div><h2>Seña con Mercado Pago</h2><p>Cobrar una parte al reservar los servicios de color. Disponible en la próxima versión.</p></div>
          <span className="tenue">Próximamente</span>
        </div>
        <div className="acciones-fila">
          <button className="boton boton-primario">{guardado ? 'Guardado' : 'Guardar cambios'}</button>
        </div>
      </form>
    </div>
  )
}
