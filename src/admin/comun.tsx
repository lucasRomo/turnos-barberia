import { useMemo, useState, type FormEvent } from 'react'
import { useOutletContext } from 'react-router-dom'
import { negocio, type Barbero, type SucursalId } from '../config/negocio'
import { capital, duracion, fechaRelativa, hora, iniciales, pesos } from '../lib/formato'
import { actualizarTurno, cobrarTurno, crearCliente, crearTurno, huecos, leer, useDemo } from '../lib/store'
import { estados, metodos, origenes, type Estado, type MetodoPago, type Turno } from '../lib/tipos'
import { Dialogo } from '../lib/ui'

export type Alcance = SucursalId | 'todas'
export type Contexto = { alcance: Alcance; nuevoTurno: (p?: Partial<NuevoTurnoDatos>) => void; verTurno: (id: string) => void }
export const useAdmin = () => useOutletContext<Contexto>()

export const enAlcance = (alcance: Alcance) => (x: { sucursal: SucursalId }) => alcance === 'todas' || x.sucursal === alcance
export const nombreAlcance = (a: Alcance) =>
  a === 'todas' ? 'Las dos sucursales' : negocio.sucursales.find((s) => s.id === a)!.nombre

export function Persona({ b, chico }: { b: Pick<Barbero, 'nombre' | 'tono'>; chico?: boolean }) {
  return (
    <span className={`persona ${chico ? 'persona-chica' : ''}`} style={{ ['--tono' as string]: b.tono }} aria-hidden="true">
      {iniciales(b.nombre)}
    </span>
  )
}

export function Marca({ estado }: { estado: Turno['estado'] }) {
  return <span className={`estado estado-${estado}`}>{estados[estado]}</span>
}

/** Indexa datos que casi todas las pantallas necesitan. */
export function useIndices(e: Estado) {
  return useMemo(
    () => ({
      cliente: Object.fromEntries(e.clientes.map((c) => [c.id, c])),
      barbero: Object.fromEntries(e.equipo.map((b) => [b.id, b])),
      servicio: Object.fromEntries(e.servicios.map((s) => [s.id, s])),
    }),
    [e.clientes, e.equipo, e.servicios],
  )
}

// ——— Detalle de un turno ———

export function DetalleTurno({ id, cerrar }: { id: string | null; cerrar: () => void }) {
  const e = useDemo()
  const ix = useIndices(e)
  const t = e.turnos.find((x) => x.id === id)
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
  if (!t) return <Dialogo abierto={false} cerrar={cerrar} titulo="">{null}</Dialogo>
  const c = ix.cliente[t.clienteId]
  const b = ix.barbero[t.barberoId]
  const s = ix.servicio[t.servicioId]
  const visitas = e.turnos.filter((x) => x.clienteId === c.id && x.estado === 'atendido').length
  const mensaje = encodeURIComponent(
    `Hola ${c.nombre.split(' ')[0]}! Te recordamos tu turno en ${negocio.nombre} ${fechaRelativa(t.dia)} a las ${hora(t.inicio)} con ${b.nombre}. Si no podés venir, avisanos. ¡Gracias!`,
  )
  return (
    <Dialogo abierto={!!t} cerrar={cerrar} titulo={`${hora(t.inicio)} · ${c.nombre}`}>
      <dl className="ficha">
        <div><dt>Servicio</dt><dd>{s.nombre} · {duracion(t.duracion)}</dd></div>
        <div><dt>Precio</dt><dd>{pesos(t.precio)}</dd></div>
        <div><dt>Barbero</dt><dd>{b.nombre}</dd></div>
        <div><dt>Día</dt><dd>{capital(fechaRelativa(t.dia))}, {negocio.sucursales.find((x) => x.id === t.sucursal)!.nombre}</dd></div>
        <div><dt>Reservó por</dt><dd>{origenes[t.origen]} · turno N° {t.numero}</dd></div>
        <div><dt>Estado</dt><dd><Marca estado={t.estado} />{t.pago && ` · ${metodos[t.pago]}`}</dd></div>
        <div><dt>Cliente</dt><dd>{c.telefono} · {visitas} {visitas === 1 ? 'visita' : 'visitas'}</dd></div>
      </dl>
      {c.nota && <p className="nota">{c.nota}</p>}
      {t.estado === 'reservado' && (
        <div className="cobro">
          <label className="campo">
            Cobrar con
            <select value={metodo} onChange={(ev) => setMetodo(ev.target.value as MetodoPago)}>
              {Object.entries(metodos).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <button className="boton boton-primario" onClick={() => { cobrarTurno(t.id, metodo); cerrar() }}>
            Atendido y cobrado {pesos(t.precio)}
          </button>
        </div>
      )}
      <div className="acciones-fila">
        {t.estado === 'reservado' && (
          <>
            <a className="boton" href={`https://wa.me/54${c.telefono.replace(/\D/g, '')}?text=${mensaje}`} target="_blank" rel="noreferrer">
              Recordar por WhatsApp
            </a>
            <button className="boton" onClick={() => { actualizarTurno(t.id, { estado: 'ausente' }); cerrar() }}>No vino</button>
            <button className="boton boton-peligro" onClick={() => { actualizarTurno(t.id, { estado: 'cancelado' }); cerrar() }}>Cancelar turno</button>
          </>
        )}
        {t.estado !== 'reservado' && (
          <button className="boton" onClick={() => actualizarTurno(t.id, { estado: 'reservado', pago: undefined })}>Volver a reservado</button>
        )}
      </div>
    </Dialogo>
  )
}

// ——— Nuevo turno desde el mostrador ———

export type NuevoTurnoDatos = { sucursal: SucursalId; dia: string; inicio: number; barberoId: string; servicioId: string }

export function NuevoTurno({ datos, cerrar }: { datos: NuevoTurnoDatos | null; cerrar: () => void }) {
  return (
    <Dialogo abierto={!!datos} cerrar={cerrar} titulo="Nuevo turno" ancho={520}>
      {datos && <FormNuevoTurno inicial={datos} cerrar={cerrar} />}
    </Dialogo>
  )
}

function FormNuevoTurno({ inicial, cerrar }: { inicial: NuevoTurnoDatos; cerrar: () => void }) {
  const e = useDemo()
  const [d, setD] = useState(inicial)
  const [cliente, setCliente] = useState('')
  const [tel, setTel] = useState('')
  const [origen, setOrigen] = useState<Turno['origen']>('whatsapp')
  const coincidencias = cliente.length > 1 ? e.clientes.filter((c) => c.nombre.toLowerCase().includes(cliente.toLowerCase())).slice(0, 4) : []
  const libres = huecos(e, d.sucursal, d.dia, d.servicioId, d.barberoId)
  const ocupado = !libres.some((h) => h.inicio === d.inicio)
  const equipo = e.equipo.filter((b) => b.sucursal === d.sucursal)

  function guardar(ev: FormEvent) {
    ev.preventDefault()
    const existente = leer().clientes.find((c) => c.nombre.toLowerCase() === cliente.trim().toLowerCase())
    const c = existente ?? crearCliente({ nombre: cliente.trim(), telefono: tel.trim() })
    crearTurno({ ...d, clienteId: c.id, origen })
    cerrar()
  }

  return (
    <form className="formulario" onSubmit={guardar}>
      <label className="campo">
        Cliente
        <input required value={cliente} onChange={(ev) => setCliente(ev.target.value)} placeholder="Nombre y apellido" list="clientes-sugeridos" />
        <datalist id="clientes-sugeridos">
          {coincidencias.map((c) => <option key={c.id} value={c.nombre}>{c.telefono}</option>)}
        </datalist>
      </label>
      {!e.clientes.some((c) => c.nombre.toLowerCase() === cliente.trim().toLowerCase()) && cliente.length > 2 && (
        <label className="campo">
          WhatsApp del cliente nuevo
          <input value={tel} onChange={(ev) => setTel(ev.target.value)} inputMode="tel" placeholder="3541 00-0000" />
        </label>
      )}
      <div className="campos-2">
        <label className="campo">
          Servicio
          <select value={d.servicioId} onChange={(ev) => setD({ ...d, servicioId: ev.target.value })}>
            {e.servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre} · {pesos(s.precio)}</option>)}
          </select>
        </label>
        <label className="campo">
          Barbero
          <select value={d.barberoId} onChange={(ev) => setD({ ...d, barberoId: ev.target.value })}>
            {equipo.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </label>
        <label className="campo">
          Día
          <input type="date" value={d.dia} onChange={(ev) => ev.target.value && setD({ ...d, dia: ev.target.value })} />
        </label>
        <label className="campo">
          Hora
          <select value={d.inicio} onChange={(ev) => setD({ ...d, inicio: Number(ev.target.value) })}>
            {!libres.some((h) => h.inicio === d.inicio) && <option value={d.inicio}>{hora(d.inicio)} (ocupado)</option>}
            {libres.map((h) => <option key={h.inicio} value={h.inicio}>{hora(h.inicio)}</option>)}
          </select>
        </label>
      </div>
      <label className="campo">
        Pidió el turno por
        <select value={origen} onChange={(ev) => setOrigen(ev.target.value as Turno['origen'])}>
          <option value="whatsapp">WhatsApp</option>
          <option value="mostrador">Mostrador</option>
        </select>
      </label>
      {ocupado && <p className="aviso">Ese horario ya está ocupado para {equipo.find((b) => b.id === d.barberoId)?.nombre}. Elegí otra hora.</p>}
      <div className="acciones-fila">
        <button type="button" className="boton" onClick={cerrar}>Cancelar</button>
        <button type="submit" className="boton boton-primario" disabled={ocupado}>Guardar turno</button>
      </div>
    </form>
  )
}

// ——— Gráfico de barras simple ———

export function Barras({
  datos,
  alto = 200,
  formato = pesos,
  resaltar,
}: {
  datos: { etiqueta: string; valor: number; detalle?: string }[]
  alto?: number
  formato?: (n: number) => string
  resaltar?: (i: number) => boolean
}) {
  const max = Math.max(1, ...datos.map((d) => d.valor))
  const [sobre, setSobre] = useState<number | null>(null)
  const guias = [0.5, 1].map((f) => max * f)
  return (
    <div className="barras" style={{ height: alto }} onMouseLeave={() => setSobre(null)}>
      <div className="barras-guias" aria-hidden="true">
        {guias.map((g) => (
          <span key={g} style={{ bottom: `${(g / max) * 100}%` }}>{formato(Math.round(g))}</span>
        ))}
      </div>
      <div className="barras-columnas" role="list">
        {datos.map((d, i) => (
          <div
            key={i}
            role="listitem"
            className={`barra ${resaltar?.(i) ? 'barra-resaltada' : ''} ${sobre === i ? 'barra-sobre' : ''}`}
            onMouseEnter={() => setSobre(i)}
            aria-label={`${d.etiqueta}: ${formato(d.valor)}`}
          >
            <span className="barra-relleno" style={{ height: `${(d.valor / max) * 100}%` }} />
            {sobre === i && (
              <span className="barra-nota">
                <strong>{formato(d.valor)}</strong>
                {d.detalle ?? d.etiqueta}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
