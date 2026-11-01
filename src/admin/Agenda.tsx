import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { negocio, type SucursalId } from '../config/negocio'
import { capital, fechaCorta, fechaLarga, hoyClave, pesos, sumarDias } from '../lib/formato'
import { abierto, useDemo } from '../lib/store'
import { origenes } from '../lib/tipos'
import Carriles from './Carriles'
import { enAlcance, useAdmin, type Alcance } from './comun'

export default function Agenda() {
  const e = useDemo()
  const { alcance: global, verTurno, nuevoTurno } = useAdmin()
  const [q, setQ] = useSearchParams()
  const hoy = hoyClave()
  const dia = q.get('dia') ?? hoy
  const alcance = (q.get('suc') as SucursalId | null) ?? global
  const ir = (cambios: Record<string, string>) => setQ({ dia, ...(q.get('suc') ? { suc: q.get('suc')! } : {}), ...cambios })

  // La semana que contiene el día elegido, de lunes a domingo
  const semana = useMemo(() => {
    const dow = (new Date(dia + 'T12:00').getDay() + 6) % 7
    return Array.from({ length: 7 }, (_, i) => sumarDias(dia, i - dow))
  }, [dia])

  const resumen = useMemo(() => {
    const filtro = enAlcance(alcance as Alcance)
    const porDia = Object.fromEntries(
      semana.map((d) => [d, e.turnos.filter((t) => t.dia === d && filtro(t) && t.estado !== 'cancelado').length]),
    )
    const delDia = e.turnos.filter((t) => t.dia === dia && filtro(t) && t.estado !== 'cancelado')
    const porOrigen = Object.keys(origenes).map((o) => ({ o, n: delDia.filter((t) => t.origen === o).length }))
    return { porDia, delDia, porOrigen, total: delDia.reduce((s, t) => s + t.precio, 0) }
  }, [e.turnos, semana, dia, alcance])

  return (
    <div className="pantalla">
      <div className="titulo-fila">
        <div>
          <h1>Agenda</h1>
          <p>
            {capital(fechaLarga(dia))} · {resumen.delDia.length} turnos · {pesos(resumen.total)} en servicios
          </p>
        </div>
        <div className="controles">
          <div className="segmentos" role="tablist" aria-label="Sucursal">
            {(['todas', ...negocio.sucursales.map((s) => s.id)] as Alcance[]).map((s) => (
              <button key={s} role="tab" aria-selected={alcance === s} className={alcance === s ? 'activa' : ''} onClick={() => setQ({ dia, suc: s })}>
                {s === 'todas' ? 'Todas' : negocio.sucursales.find((x) => x.id === s)!.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="semana">
        <button className="boton boton-chico" onClick={() => ir({ dia: sumarDias(dia, -7) })} aria-label="Semana anterior">←</button>
        <div className="semana-dias">
          {semana.map((d) => {
            const cerrado = negocio.sucursales.every((s) => (alcance !== 'todas' && s.id !== alcance) || !abierto(s.id, d))
            return (
              <button key={d} className={`semana-dia ${d === dia ? 'activa' : ''} ${d === hoy ? 'es-hoy' : ''}`} onClick={() => ir({ dia: d })}>
                <span>{d === hoy ? 'Hoy' : capital(fechaCorta(d))}</span>
                <small>{cerrado ? 'Cerrado' : `${resumen.porDia[d]} turnos`}</small>
              </button>
            )
          })}
        </div>
        <button className="boton boton-chico" onClick={() => ir({ dia: sumarDias(dia, 7) })} aria-label="Semana siguiente">→</button>
        {dia !== hoy && <button className="boton boton-chico" onClick={() => ir({ dia: hoy })}>Hoy</button>}
      </div>

      <section className="tarjeta">
        <div className="tarjeta-cabeza">
          <h2>Sillones</h2>
          <p className="ayuda">Tocá un espacio libre para cargar un turno.</p>
        </div>
        <Carriles
          dia={dia}
          alcance={alcance as Alcance}
          alto={64}
          alTurno={verTurno}
          alHueco={(barberoId, inicio) => {
            const b = e.equipo.find((x) => x.id === barberoId)!
            nuevoTurno({ sucursal: b.sucursal, dia, inicio, barberoId })
          }}
        />
      </section>

      <div className="kpis kpis-chicos">
        {resumen.porOrigen.map(({ o, n }) => (
          <div className="kpi" key={o}>
            <span>Reservados por {origenes[o as keyof typeof origenes]}</span>
            <strong>{n}</strong>
            <small>{resumen.delDia.length ? Math.round((n / resumen.delDia.length) * 100) : 0}% de los turnos del día</small>
          </div>
        ))}
      </div>
    </div>
  )
}
