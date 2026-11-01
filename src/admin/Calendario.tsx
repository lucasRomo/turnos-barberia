// La agenda como calendario: una columna por barbero (vista día) o por día (vista semana),
// la hora de arriba hacia abajo, como se lee una planilla de turnos.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Globe, MessageCircle, Plus, Store } from 'lucide-react'
import { negocio, type Barbero, type SucursalId } from '../config/negocio'
import { aMin, ahoraMin, capital, fechaCorta, hora, hoyClave, pesos } from '../lib/formato'
import { franjas, useDemo } from '../lib/store'
import { Persona, useIndices } from './comun'

const SLOT = 30 // minutos por fila
const ALTO = 46 // píxeles por fila

const iconoOrigen = { web: Globe, whatsapp: MessageCircle, mostrador: Store }

/** Rango horario que cubre todas las sucursales abiertas en esos días. */
function rango(sucursales: SucursalId[], dias: string[]) {
  const todas = dias.flatMap((d) => sucursales.flatMap((s) => franjas(s, d)))
  if (!todas.length) return { desde: 600, hasta: 1230 }
  const desde = Math.min(...todas.map(([a]) => aMin(a)))
  const hasta = Math.max(...todas.map(([, b]) => aMin(b)))
  return { desde: Math.floor(desde / 60) * 60, hasta: Math.ceil(hasta / 60) * 60 }
}

/** Tramos cerrados de una sucursal un día, dentro del rango visible. */
function cerrados(s: SucursalId, dia: string, desde: number, hasta: number) {
  const fr = franjas(s, dia)
  if (!fr.length) return [[desde, hasta]]
  const out: [number, number][] = []
  let cursor = desde
  for (const [a, b] of fr) {
    if (aMin(a) > cursor) out.push([cursor, aMin(a)])
    cursor = aMin(b)
  }
  if (cursor < hasta) out.push([cursor, hasta])
  return out
}

type Columna = { clave: string; titulo: React.ReactNode; dia: string; sucursal: SucursalId; barberos: Barbero[]; franco?: boolean; grupo?: string }

export default function Calendario({
  vista,
  dia,
  semana,
  sucursales,
  visibles,
  alTurno,
  alHueco,
  alDia,
}: {
  vista: 'dia' | 'semana'
  dia: string
  semana: string[]
  sucursales: SucursalId[]
  visibles: string[]
  alTurno: (id: string) => void
  alHueco: (p: { dia: string; inicio: number; barberoId: string; sucursal: SucursalId }) => void
  alDia: (d: string) => void
}) {
  const e = useDemo()
  const ix = useIndices(e)
  const hoy = hoyClave()
  const [ahora, setAhora] = useState(ahoraMin())
  const caja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setInterval(() => setAhora(ahoraMin()), 30_000)
    return () => clearInterval(t)
  }, [])

  const equipo = e.equipo.filter((b) => sucursales.includes(b.sucursal) && visibles.includes(b.id))
  const dias = vista === 'dia' ? [dia] : semana
  const { desde, hasta } = useMemo(() => rango(sucursales, dias), [sucursales, dias])
  const filas = (hasta - desde) / SLOT
  const y = (min: number) => ((min - desde) / SLOT) * ALTO

  const columnas: Columna[] =
    vista === 'dia'
      ? equipo.map((b) => ({
          clave: b.id,
          dia,
          sucursal: b.sucursal,
          barberos: [b],
          franco: b.franco === new Date(dia + 'T12:00').getDay(),
          grupo: negocio.sucursales.find((s) => s.id === b.sucursal)!.nombre,
          titulo: null,
        }))
      : semana.map((d) => ({ clave: d, dia: d, sucursal: sucursales[0], barberos: equipo, titulo: null }))

  // Al abrir el día de hoy, la grilla arranca cerca de la hora actual
  useEffect(() => {
    const el = caja.current
    if (!el) return
    el.scrollTop = dias.includes(hoy) && ahora > desde ? Math.max(0, y(ahora) - 140) : 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, dia])

  const turnosDe = (c: Columna) =>
    e.turnos.filter(
      (t) => t.dia === c.dia && t.estado !== 'cancelado' && c.barberos.some((b) => b.id === t.barberoId),
    )

  if (!equipo.length) return <p className="vacio">Elegí al menos un barbero para ver su agenda.</p>

  const horas: number[] = []
  for (let h = desde; h < hasta; h += 60) horas.push(h)

  return (
    <div className={`calendario calendario-${vista}`} style={{ ['--alto' as string]: `${ALTO}px`, ['--columnas' as string]: columnas.length }}>
      <div className="cal-caja" ref={caja}>
        <div className="cal-cabeza">
          <span className="cal-esquina" />
          {columnas.map((c, i) => {
            const lista = turnosDe(c)
            if (vista === 'dia') {
              const b = c.barberos[0]
              const abierto = franjas(c.sucursal, c.dia).reduce((m, [a, z]) => m + aMin(z) - aMin(a), 0)
              const ocupado = lista.reduce((m, t) => m + t.duracion, 0)
              const nuevoGrupo = sucursales.length > 1 && (i === 0 || columnas[i - 1].sucursal !== c.sucursal)
              return (
                <div key={c.clave} className={`cal-col-cabeza ${nuevoGrupo && i > 0 ? 'cal-separa' : ''}`} style={{ ['--tono' as string]: b.tono }}>
                  {nuevoGrupo && <span className="cal-grupo">{c.grupo}</span>}
                  <Persona b={b} />
                  <span>
                    <strong>{b.nombre}</strong>
                    <small>{c.franco ? 'De franco' : abierto ? `${lista.length} turnos · ${Math.round((ocupado / abierto) * 100)}%` : 'Cerrado'}</small>
                  </span>
                  {!c.franco && abierto > 0 && (
                    <span className="cal-ocupa" aria-hidden="true">
                      <span style={{ width: `${Math.min(100, (ocupado / abierto) * 100)}%` }} />
                    </span>
                  )}
                </div>
              )
            }
            const total = lista.reduce((s, t) => s + t.precio, 0)
            return (
              <button key={c.clave} className={`cal-col-cabeza cal-dia ${c.dia === hoy ? 'es-hoy' : ''}`} onClick={() => alDia(c.dia)}>
                <span className="cal-dia-nombre">{capital(fechaCorta(c.dia).split(' ')[0])}</span>
                <span className="cal-dia-num">{Number(c.dia.slice(8))}</span>
                <small>{lista.length ? `${lista.length} · ${pesos(total)}` : 'Sin turnos'}</small>
              </button>
            )
          })}
        </div>

        <div className="cal-cuerpo" style={{ height: filas * ALTO }}>
          <div className="cal-horas" aria-hidden="true">
            {horas.map((h) => (
              <span key={h} style={{ top: y(h) }}>
                {hora(h)}
              </span>
            ))}
            {dias.includes(hoy) && ahora > desde && ahora < hasta && (
              <em className="cal-ahora-hora" style={{ top: y(ahora) }}>
                {hora(ahora)}
              </em>
            )}
          </div>
          {columnas.map((c, i) => {
            const lista = turnosDe(c)
            const esHoy = c.dia === hoy
            const zonasCerradas =
              vista === 'dia'
                ? c.franco
                  ? [[desde, hasta]]
                  : cerrados(c.sucursal, c.dia, desde, hasta)
                : sucursales.length === 1
                  ? cerrados(c.sucursal, c.dia, desde, hasta)
                  : (() => {
                      // Con las dos sucursales, solo se tacha lo que está cerrado en ambas
                      const minutos: [number, number][] = []
                      for (let m = desde; m < hasta; m += SLOT)
                        if (sucursales.every((s) => !franjas(s, c.dia).some(([a, b]) => m >= aMin(a) && m < aMin(b)))) minutos.push([m, m + SLOT])
                      return minutos
                    })()
            const sep = vista === 'dia' && sucursales.length > 1 && i > 0 && columnas[i - 1].sucursal !== c.sucursal
            return (
              <div
                key={c.clave}
                className={`cal-col ${esHoy && vista === 'semana' ? 'cal-col-hoy' : ''} ${sep ? 'cal-separa' : ''}`}
                onClick={(ev) => {
                  if (ev.target !== ev.currentTarget || c.franco) return
                  const r = ev.currentTarget.getBoundingClientRect()
                  const inicio = desde + Math.floor((ev.clientY - r.top) / ALTO) * SLOT
                  const b = c.barberos[0]
                  alHueco({ dia: c.dia, inicio, barberoId: b.id, sucursal: b.sucursal })
                }}
              >
                {Array.from({ length: filas }, (_, f) => (
                  <span key={f} className={`cal-fila ${(desde + f * SLOT) % 60 === 0 ? 'cal-fila-hora' : ''}`} style={{ top: f * ALTO }} />
                ))}
                {zonasCerradas.map(([a, b]) => (
                  <span key={a} className="cal-cerrado" style={{ top: y(a), height: y(b) - y(a) }}>
                    {c.franco && a === desde && <em>De franco</em>}
                  </span>
                ))}
                {vista === 'dia' && !c.franco && <span className="cal-fantasma" aria-hidden="true"><Plus size={14} /></span>}
                {vista === 'semana' &&
                  Array.from({ length: filas }, (_, f) => {
                    const m = desde + f * SLOT
                    if (zonasCerradas.some(([a, b]) => m >= a && m < b)) return null
                    const sillas = c.barberos.map((b) => ({
                      b,
                      ocupada: lista.some((t) => t.barberoId === b.id && t.estado !== 'ausente' && t.inicio <= m && t.inicio + t.duracion > m),
                      franco: b.franco === new Date(c.dia + 'T12:00').getDay() || !franjas(b.sucursal, c.dia).some(([a, z]) => m >= aMin(a) && m < aMin(z)),
                    }))
                    const libres = sillas.filter((x) => !x.ocupada && !x.franco).length
                    return (
                      <button
                        key={f}
                        className={`cal-celda ${libres === 0 ? 'llena' : ''}`}
                        style={{ top: f * ALTO }}
                        onClick={() => alDia(c.dia)}
                        title={`${hora(m)}: ${libres ? `${libres} ${libres === 1 ? 'sillón libre' : 'sillones libres'}` : 'completo'}`}
                      >
                        <span className="cal-sillas" aria-hidden="true">
                          {sillas.map(({ b, ocupada, franco }) => (
                            <span key={b.id} className={ocupada ? 'ocupada' : franco ? 'franco' : ''} style={{ ['--tono' as string]: b.tono }} />
                          ))}
                        </span>
                        <small>{libres ? `${libres} libre${libres > 1 ? 's' : ''}` : 'Lleno'}</small>
                      </button>
                    )
                  })}
                {vista === 'dia' && lista.map((t) => {
                  const cl = ix.cliente[t.clienteId]
                  const sv = ix.servicio[t.servicioId]
                  const b = ix.barbero[t.barberoId]
                  const enCurso = esHoy && ahora >= t.inicio && ahora < t.inicio + t.duracion && t.estado === 'reservado'
                  const pasado = esHoy ? t.inicio + t.duracion <= ahora : c.dia < hoy
                  const Icono = iconoOrigen[t.origen]
                  const corto = t.duracion <= 30
                  return (
                    <button
                      key={t.id}
                      className={`cal-turno cal-${t.estado} ${enCurso ? 'cal-en-curso' : ''} ${pasado && t.estado === 'reservado' ? 'cal-pasado' : ''} ${corto ? 'cal-corto' : ''}`}
                      style={{
                        top: y(t.inicio) + 2,
                        height: (t.duracion / SLOT) * ALTO - 4,
                        ['--tono' as string]: b.tono,
                      }}
                      onClick={() => alTurno(t.id)}
                      title={`${hora(t.inicio)} a ${hora(t.inicio + t.duracion)} · ${cl.nombre} · ${sv.nombre} con ${b.nombre}`}
                    >
                      <span className="cal-turno-hora">
                        {hora(t.inicio)}
                        {!corto && <> – {hora(t.inicio + t.duracion)}</>}
                        {t.estado === 'atendido' && <Check size={13} strokeWidth={2.6} aria-label="Atendido" />}
                        {enCurso && <span className="cal-vivo">En curso</span>}
                      </span>
                      <strong>{cl.nombre}</strong>
                      {(
                        <span className="cal-turno-pie">
                          <span>{sv.nombre}</span>
                          <span className="cal-turno-precio">
                            <Icono size={12} aria-hidden="true" /> {pesos(t.precio)}
                          </span>
                        </span>
                      )}
                    </button>
                  )
                })}
                {esHoy && ahora > desde && ahora < hasta && (
                  <span className="cal-ahora" style={{ top: y(ahora) }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
