// La agenda del celular como calendario, al estilo de Fresha o Booksy: la hora baja por la izquierda,
// una columna por barbero y se desliza de costado para ver al resto. Se toca un hueco y se carga el turno.
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Check } from 'lucide-react'
import { negocio, type Barbero } from '../config/negocio'
import { ahoraMin, aMin, hora, hoyClave } from '../lib/formato'
import { franjas, useDemo } from '../lib/store'
import type { Turno } from '../lib/tipos'
import { Persona, useAdmin, useIndices } from './comun'

const PX = 1.5 // píxeles por minuto: una hora mide 90 px
const CABEZA = 58

/** De qué hora a qué hora mostrar: lo que abren las sucursales ese día, en horas enteras. */
function rango(barberos: Barbero[], dia: string) {
  const todas = barberos.flatMap((b) => franjas(b.sucursal, dia))
  if (!todas.length) return { desde: 600, hasta: 1260 }
  return {
    desde: Math.floor(Math.min(...todas.map(([a]) => aMin(a))) / 60) * 60,
    hasta: Math.ceil(Math.max(...todas.map(([, b]) => aMin(b))) / 60) * 60,
  }
}

/** Los tramos en que la sucursal está cerrada, dentro del rango visible. */
function cerrados(b: Barbero, dia: string, desde: number, hasta: number): [number, number][] {
  const fr = franjas(b.sucursal, dia).map(([x, y]) => [aMin(x), aMin(y)])
  if (!fr.length || b.franco === new Date(dia + 'T12:00').getDay()) return [[desde, hasta]]
  const out: [number, number][] = []
  let cursor = desde
  for (const [a, z] of fr) {
    if (a > cursor) out.push([cursor, a])
    cursor = z
  }
  if (cursor < hasta) out.push([cursor, hasta])
  return out
}

export default function CalendarioMovil({ dia, barberos, turnos }: { dia: string; barberos: Barbero[]; turnos: Turno[] }) {
  const e = useDemo()
  const ix = useIndices(e)
  const { verTurno, nuevoTurno } = useAdmin()
  const hoy = hoyClave()
  const [ahora, setAhora] = useState(ahoraMin())
  const caja = useRef<HTMLDivElement>(null)
  const { desde, hasta } = rango(barberos, dia)
  const y = (min: number) => (min - desde) * PX
  const uno = barberos.length === 1

  useEffect(() => {
    const t = setInterval(() => setAhora(ahoraMin()), 30_000)
    return () => clearInterval(t)
  }, [])

  // Hoy arranca mostrando la hora actual; otro día, la apertura
  useEffect(() => {
    const el = caja.current
    if (!el) return
    el.scrollTop = dia === hoy && ahora > desde ? Math.max(0, y(ahora) - 110) : 0
    el.scrollLeft = 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dia, barberos.length])

  const horas: number[] = []
  for (let h = desde; h < hasta; h += 60) horas.push(h)

  /** Tocar un espacio vacío carga un turno a esa hora, redondeada al cuarto de hora. */
  function tocarHueco(ev: MouseEvent<HTMLDivElement>, b: Barbero) {
    if (ev.target !== ev.currentTarget) return
    const q = ev.currentTarget.getBoundingClientRect()
    const inicio = desde + Math.floor((ev.clientY - q.top) / PX / 15) * 15
    const abierto = franjas(b.sucursal, dia).some(([a, z]) => inicio >= aMin(a) && inicio < aMin(z))
    if (!abierto || b.franco === new Date(dia + 'T12:00').getDay()) return
    if (dia === hoy && inicio + 15 < ahora) return
    nuevoTurno({ dia, inicio, barberoId: b.id, sucursal: b.sucursal })
  }

  return (
    <div className={`amc ${uno ? 'amc-uno' : ''}`} ref={caja} style={{ ['--columnas' as string]: barberos.length }}>
      <div className="amc-fila amc-cabeza" style={{ height: CABEZA }}>
        <span className="amc-esquina" />
        {barberos.map((b, i) => {
          const suyos = turnos.filter((t) => t.barberoId === b.id)
          const otraSucursal = negocio.sucursales.length > 1 && i > 0 && barberos[i - 1].sucursal !== b.sucursal
          return (
            <div key={b.id} className={`amc-barbero ${otraSucursal ? 'amc-separa' : ''}`}>
              <Persona b={b} chico />
              <span>
                <strong>{b.nombre}</strong>
                <small>{b.franco === new Date(dia + 'T12:00').getDay() ? 'Franco' : `${suyos.length} turnos`}</small>
              </span>
            </div>
          )
        })}
      </div>

      <div className="amc-fila amc-cuerpo" style={{ height: y(hasta) }}>
        <div className="amc-horas" aria-hidden="true">
          {horas.map((h) => (
            <span key={h} style={{ top: y(h) }}>
              {hora(h)}
            </span>
          ))}
        </div>

        {barberos.map((b, i) => {
          const otraSucursal = negocio.sucursales.length > 1 && i > 0 && barberos[i - 1].sucursal !== b.sucursal
          return (
            <div
              key={b.id}
              className={`amc-columna ${otraSucursal ? 'amc-separa' : ''}`}
              style={{ ['--tono' as string]: b.tono }}
              onClick={(ev) => tocarHueco(ev, b)}
              aria-label={`Agenda de ${b.nombre}. Tocá un espacio libre para cargar un turno.`}
            >
              {horas.map((h) => (
                <span key={h} className="amc-linea" style={{ top: y(h) }} aria-hidden="true" />
              ))}
              {cerrados(b, dia, desde, hasta).map(([a, z]) => (
                <span key={a} className="amc-cerrado" style={{ top: y(a), height: (z - a) * PX }} aria-hidden="true">
                  {z - a >= 90 && (b.franco === new Date(dia + 'T12:00').getDay() ? 'Franco' : 'Cerrado')}
                </span>
              ))}
              {turnos
                .filter((t) => t.barberoId === b.id)
                .map((t) => {
                  const alto = t.duracion * PX - 3
                  const enCurso = dia === hoy && t.estado === 'reservado' && ahora >= t.inicio && ahora < t.inicio + t.duracion
                  const cliente = ix.cliente[t.clienteId]?.nombre ?? 'Cliente'
                  return (
                    <button
                      key={t.id}
                      className={`amc-turno amc-${enCurso ? 'en-curso' : t.estado} ${alto < 44 ? 'amc-corto' : ''}`}
                      style={{ top: y(t.inicio) + 1, height: alto }}
                      onClick={() => verTurno(t.id)}
                      aria-label={`${hora(t.inicio)}, ${cliente}, ${ix.servicio[t.servicioId]?.nombre}`}
                    >
                      <span className="amc-turno-texto">
                        <span className="amc-turno-hora">
                          {hora(t.inicio)}
                          {t.estado === 'atendido' && <Check size={12} strokeWidth={3} aria-hidden="true" />}
                          {enCurso && uno && <i>Ahora</i>}
                        </span>
                        <strong>{uno ? cliente : cliente.split(' ')[0] + (cliente.split(' ')[1] ? ` ${cliente.split(' ')[1][0]}.` : '')}</strong>
                        {alto >= 60 && <small>{ix.servicio[t.servicioId]?.nombre}</small>}
                      </span>
                    </button>
                  )
                })}
            </div>
          )
        })}

        {dia === hoy && ahora >= desde && ahora < hasta && (
          <div className="amc-ahora" style={{ top: y(ahora) }} aria-label={`Ahora, ${hora(ahora)}`}>
            <span>{hora(ahora)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
