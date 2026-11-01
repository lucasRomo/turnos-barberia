// Los sillones del día: un carril por barbero, la hora de izquierda a derecha.
import { useMemo } from 'react'
import { negocio } from '../config/negocio'
import { aMin, ahoraMin, hora, hoyClave } from '../lib/formato'
import { franjas, useDemo } from '../lib/store'
import { Persona, useIndices, type Alcance } from './comun'

export default function Carriles({
  dia,
  alcance,
  alto = 52,
  alTurno,
  alHueco,
}: {
  dia: string
  alcance: Alcance
  alto?: number
  alTurno: (id: string) => void
  alHueco?: (barberoId: string, inicio: number) => void
}) {
  const e = useDemo()
  const ix = useIndices(e)
  const sucursales = negocio.sucursales.filter((s) => alcance === 'todas' || s.id === alcance)
  const abiertas = sucursales.filter((s) => franjas(s.id, dia).length)

  const { desde, hasta } = useMemo(() => {
    const todas = abiertas.flatMap((s) => franjas(s.id, dia))
    if (!todas.length) return { desde: 600, hasta: 1230 }
    return {
      desde: Math.min(...todas.map(([a]) => aMin(a))),
      hasta: Math.max(...todas.map(([, b]) => aMin(b))),
    }
  }, [abiertas, dia])

  if (!abiertas.length) {
    return <p className="vacio">{sucursales.length > 1 ? 'Las dos sucursales están cerradas' : `${sucursales[0].nombre} está cerrada`} este día.</p>
  }

  const total = hasta - desde
  const x = (min: number) => `${((min - desde) / total) * 100}%`
  const horas: number[] = []
  for (let h = Math.ceil(desde / 60) * 60; h <= hasta; h += 60) horas.push(h)
  const ahora = ahoraMin()
  const esHoy = dia === hoyClave()

  return (
    <div className="carriles" style={{ ['--fila' as string]: `${alto}px` }}>
      <div className="carriles-escala">
        <span />
        <div className="carriles-horas">
          {horas.map((h) => (
            <span key={h} style={{ left: x(h) }}>{hora(h)}</span>
          ))}
        </div>
      </div>
      {abiertas.map((s) => {
        const fr = franjas(s.id, dia)
        const cerrados: [number, number][] = []
        let cursor = desde
        for (const [a, b] of fr) {
          if (aMin(a) > cursor) cerrados.push([cursor, aMin(a)])
          cursor = aMin(b)
        }
        if (cursor < hasta) cerrados.push([cursor, hasta])
        return (
          <div className="carriles-grupo" key={s.id}>
            {sucursales.length > 1 && <h3 className="carriles-sucursal">{s.nombre}</h3>}
            {e.equipo
              .filter((b) => b.sucursal === s.id)
              .map((b) => {
                const turnos = e.turnos.filter((t) => t.dia === dia && t.barberoId === b.id && t.estado !== 'cancelado')
                const deFranco = b.franco === new Date(dia + 'T12:00').getDay()
                const ocupado = turnos.reduce((m, t) => m + t.duracion, 0)
                const abierto = fr.reduce((m, [a, c]) => m + aMin(c) - aMin(a), 0)
                return (
                  <div className="carril" key={b.id}>
                    <div className="carril-persona">
                      <Persona b={b} chico />
                      <span>
                        {b.nombre}
                        <small>{deFranco ? 'De franco' : `${Math.round((ocupado / abierto) * 100)}% ocupado`}</small>
                      </span>
                    </div>
                    <div
                      className="carril-pista"
                      onClick={(ev) => {
                        if (!alHueco || ev.target !== ev.currentTarget) return
                        const r = ev.currentTarget.getBoundingClientRect()
                        const min = desde + ((ev.clientX - r.left) / r.width) * total
                        alHueco(b.id, Math.floor(min / 30) * 30)
                      }}
                    >
                      {horas.map((h) => <span key={h} className="carril-linea" style={{ left: x(h) }} />)}
                      {deFranco && <span className="carril-cerrado" style={{ left: 0, width: '100%' }} />}
                      {cerrados.map(([a, c]) => (
                        <span key={a} className="carril-cerrado" style={{ left: x(a), width: `${((c - a) / total) * 100}%` }} />
                      ))}
                      {turnos.map((t) => {
                        const c = ix.cliente[t.clienteId]
                        const sv = ix.servicio[t.servicioId]
                        const enCurso = esHoy && t.estado === 'reservado' && ahora >= t.inicio && ahora < t.inicio + t.duracion
                        return (
                          <button
                            key={t.id}
                            className={`turno-barra turno-${t.estado} ${enCurso ? 'turno-en-curso' : ''}`}
                            style={{ left: x(t.inicio), width: `calc(${(t.duracion / total) * 100}% - 3px)`, ['--tono' as string]: b.tono }}
                            onClick={() => alTurno(t.id)}
                            title={`${hora(t.inicio)} ${c.nombre} · ${sv.nombre}`}
                          >
                            <strong>{c.nombre.split(' ')[0]} {c.nombre.split(' ')[1]?.[0]}.</strong>
                            <span>{hora(t.inicio)} · {sv.nombre}</span>
                          </button>
                        )
                      })}
                      {esHoy && ahora > desde && ahora < hasta && <span className="ahora" style={{ left: x(ahora) }} />}
                    </div>
                  </div>
                )
              })}
          </div>
        )
      })}
      <ul className="leyenda">
        <li><span className="muestra muestra-reservado" /> Reservado</li>
        <li><span className="muestra muestra-atendido" /> Atendido</li>
        <li><span className="muestra muestra-ausente" /> No vino</li>
        <li><span className="muestra muestra-cerrado" /> Cerrado</li>
        {esHoy && <li><span className="muestra muestra-ahora" /> Ahora</li>}
      </ul>
    </div>
  )
}
