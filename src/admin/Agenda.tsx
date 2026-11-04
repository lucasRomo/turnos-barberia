import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { negocio, type SucursalId } from '../config/negocio'
import { capital, deClave, diaMes, fechaLarga, hoyClave, mesAño, pesos, sumarDias } from '../lib/formato'
import { abierto, useDemo } from '../lib/store'
import { origenes } from '../lib/tipos'
import AgendaMovil from './AgendaMovil'
import Calendario from './Calendario'
import { enAlcance, Persona, useAdmin, type Alcance } from './comun'

const letras = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/** Lunes de la semana de un día. */
const lunes = (d: string) => sumarDias(d, -((deClave(d).getDay() + 6) % 7))

function MiniMes({ dia, alcance, elegir }: { dia: string; alcance: Alcance; elegir: (d: string) => void }) {
  const e = useDemo()
  const hoy = hoyClave()
  const [mes, setMes] = useState(dia.slice(0, 7) + '-01')
  const primero = lunes(mes)
  const celdas = Array.from({ length: 42 }, (_, i) => sumarDias(primero, i))
  const sucursales = negocio.sucursales.filter((s) => alcance === 'todas' || s.id === alcance)
  const porDia = useMemo(() => {
    const m: Record<string, number> = {}
    const filtro = enAlcance(alcance)
    for (const t of e.turnos) if (t.estado !== 'cancelado' && filtro(t)) m[t.dia] = (m[t.dia] ?? 0) + 1
    return m
  }, [e.turnos, alcance])
  const max = Math.max(1, ...celdas.map((d) => porDia[d] ?? 0))
  const mover = (n: number) => {
    const d = deClave(mes)
    d.setMonth(d.getMonth() + n)
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`)
  }

  return (
    <div className="minimes">
      <div className="minimes-cabeza">
        <strong>{capital(mesAño(mes))}</strong>
        <span>
          <button className="btn-icono" onClick={() => mover(-1)} aria-label="Mes anterior"><ChevronLeft size={18} /></button>
          <button className="btn-icono" onClick={() => mover(1)} aria-label="Mes siguiente"><ChevronRight size={18} /></button>
        </span>
      </div>
      <div className="minimes-grilla" role="grid" aria-label="Elegir día">
        {letras.map((l, i) => <span key={i} className="minimes-letra" aria-hidden="true">{l}</span>)}
        {celdas.map((d) => {
          const n = porDia[d] ?? 0
          const cerrado = sucursales.every((s) => !abierto(s.id, d))
          return (
            <button
              key={d}
              className={`minimes-dia ${d.slice(0, 7) !== mes.slice(0, 7) ? 'fuera' : ''} ${d === hoy ? 'es-hoy' : ''} ${d === dia ? 'activa' : ''} ${cerrado ? 'cerrado' : ''}`}
              onClick={() => elegir(d)}
              aria-label={`${fechaLarga(d)}: ${cerrado ? 'cerrado' : `${n} turnos`}`}
            >
              {Number(d.slice(8))}
              {!cerrado && n > 0 && <span className="minimes-carga" style={{ ['--carga' as string]: n / max }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** En el celular entra un barbero por vez en la vista de día. */
function useAngosto() {
  const consulta = '(max-width: 700px)'
  const [angosto, setAngosto] = useState(() => matchMedia(consulta).matches)
  useEffect(() => {
    const m = matchMedia(consulta)
    const cambiar = () => setAngosto(m.matches)
    m.addEventListener('change', cambiar)
    return () => m.removeEventListener('change', cambiar)
  }, [])
  return angosto
}

export default function Agenda() {
  const e = useDemo()
  const { alcance: global, verTurno, nuevoTurno } = useAdmin()
  const [q, setQ] = useSearchParams()
  const hoy = hoyClave()
  const dia = q.get('dia') ?? hoy
  const vista = (q.get('vista') as 'dia' | 'semana' | null) ?? 'dia'
  const alcance = ((q.get('suc') as SucursalId | null) ?? global) as Alcance
  const ir = (cambios: Record<string, string>) =>
    setQ({ dia, vista, ...(q.get('suc') ? { suc: q.get('suc')! } : {}), ...cambios })
  const [ocultos, setOcultos] = useState<string[]>([])

  const sucursales = negocio.sucursales.filter((s) => alcance === 'todas' || s.id === alcance).map((s) => s.id)
  const equipo = e.equipo.filter((b) => sucursales.includes(b.sucursal))
  const angosto = useAngosto()
  const [uno, setUno] = useState<string | null>(null)
  const dow = deClave(dia).getDay()
  const elegido = equipo.find((b) => b.id === uno) ?? equipo.find((b) => b.franco !== dow) ?? equipo[0]
  const unoPorVez = angosto && vista === 'dia' && elegido
  const visibles = unoPorVez ? [elegido.id] : equipo.filter((b) => !ocultos.includes(b.id)).map((b) => b.id)
  const semana = useMemo(() => Array.from({ length: 7 }, (_, i) => sumarDias(lunes(dia), i)), [dia])
  const paso = vista === 'dia' ? 1 : 7

  const resumen = useMemo(() => {
    const dias = vista === 'dia' ? [dia] : semana
    const lista = e.turnos.filter((t) => dias.includes(t.dia) && visibles.includes(t.barberoId) && t.estado !== 'cancelado')
    return {
      lista,
      total: lista.reduce((s, t) => s + t.precio, 0),
      atendidos: lista.filter((t) => t.estado === 'atendido').length,
      ausentes: lista.filter((t) => t.estado === 'ausente').length,
      porOrigen: (Object.keys(origenes) as (keyof typeof origenes)[]).map((o) => ({ o, n: lista.filter((t) => t.origen === o).length })),
      porBarbero: Object.fromEntries(equipo.map((b) => [b.id, lista.filter((t) => t.barberoId === b.id).length])),
    }
  }, [e.turnos, dia, semana, vista, visibles, equipo])

  const titulo =
    vista === 'dia'
      ? capital(fechaLarga(dia))
      : `${diaMes(semana[0])} al ${diaMes(semana[6])}`

  if (angosto) return <AgendaMovil dia={dia} alcance={alcance} ir={ir} />

  return (
    <div className="pantalla pantalla-agenda">
      <div className="titulo-fila">
        <div>
          <h1>Agenda</h1>
          <p>
            {titulo} · {resumen.lista.length} turnos · {pesos(resumen.total)}
          </p>
        </div>
        <div className="controles">
          <div className="navega">
            <button className="boton boton-icono" onClick={() => ir({ dia: sumarDias(dia, -paso) })} aria-label={vista === 'dia' ? 'Día anterior' : 'Semana anterior'}>
              <ChevronLeft size={18} />
            </button>
            <button className="boton" onClick={() => ir({ dia: hoy })} disabled={vista === 'dia' ? dia === hoy : semana.includes(hoy)}>
              Hoy
            </button>
            <button className="boton boton-icono" onClick={() => ir({ dia: sumarDias(dia, paso) })} aria-label={vista === 'dia' ? 'Día siguiente' : 'Semana siguiente'}>
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="segmentos" role="tablist" aria-label="Vista">
            {(['dia', 'semana'] as const).map((v) => (
              <button key={v} role="tab" aria-selected={vista === v} className={vista === v ? 'activa' : ''} onClick={() => ir({ vista: v })}>
                {v === 'dia' ? 'Día' : 'Semana'}
              </button>
            ))}
          </div>
          <div className="segmentos" role="tablist" aria-label="Sucursal">
            {(['todas', ...negocio.sucursales.map((s) => s.id)] as Alcance[]).map((s) => (
              <button key={s} role="tab" aria-selected={alcance === s} className={alcance === s ? 'activa' : ''} onClick={() => ir({ suc: s })}>
                {s === 'todas' ? 'Las dos' : negocio.sucursales.find((x) => x.id === s)!.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="agenda-cuerpo">
        <aside className="agenda-lado">
          <MiniMes dia={dia} alcance={alcance} elegir={(d) => ir({ dia: d })} />

          <section>
            <h2 className="lado-titulo">Barberos</h2>
            <ul className="filtro-barberos">
              {equipo.map((b) => {
                const activo = !ocultos.includes(b.id)
                return (
                  <li key={b.id}>
                    <button
                      className={activo ? 'activo' : ''}
                      aria-pressed={activo}
                      onClick={() => setOcultos(activo ? [...ocultos, b.id] : ocultos.filter((x) => x !== b.id))}
                      style={{ ['--tono' as string]: b.tono }}
                    >
                      <span className="filtro-marca" aria-hidden="true" />
                      <Persona b={b} chico />
                      <span className="filtro-nombre">{b.nombre}</span>
                      <span className="filtro-n">{resumen.porBarbero[b.id] ?? 0}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section>
            <h2 className="lado-titulo">{vista === 'dia' ? 'Resumen del día' : 'Resumen de la semana'}</h2>
            <dl className="ficha ficha-compacta">
              <div><dt>Turnos</dt><dd>{resumen.lista.length}</dd></div>
              <div><dt>Atendidos</dt><dd>{resumen.atendidos}</dd></div>
              <div><dt>No vinieron</dt><dd className={resumen.ausentes ? 'mal' : ''}>{resumen.ausentes}</dd></div>
              <div className="ficha-total"><dt>En servicios</dt><dd>{pesos(resumen.total)}</dd></div>
            </dl>
            <div className="origenes">
              {resumen.porOrigen.map(({ o, n }) => (
                <div key={o}>
                  <span>{origenes[o]}</span>
                  <span className="origen-barra"><span style={{ width: `${resumen.lista.length ? (n / resumen.lista.length) * 100 : 0}%` }} /></span>
                  <strong>{n}</strong>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="agenda-principal" aria-label="Calendario de turnos">
          {vista === 'dia' && (
            <div className="uno-por-vez" role="tablist" aria-label="Barbero">
              {equipo.map((b) => (
                <button key={b.id} role="tab" aria-selected={elegido?.id === b.id} className={elegido?.id === b.id ? 'activa' : ''} onClick={() => setUno(b.id)}>
                  <Persona b={b} chico />
                  {b.nombre}
                </button>
              ))}
            </div>
          )}
          <Calendario
            vista={vista}
            dia={dia}
            semana={semana}
            sucursales={sucursales}
            visibles={visibles}
            alTurno={verTurno}
            alHueco={(p) => nuevoTurno(p)}
            alDia={(d) => ir({ dia: d, vista: 'dia' })}
          />
          <ul className="leyenda">
            <li><span className="muestra muestra-reservado" /> Reservado</li>
            <li><span className="muestra muestra-atendido" /> Atendido</li>
            <li><span className="muestra muestra-ausente" /> No vino</li>
            <li><span className="muestra muestra-cerrado" /> Cerrado o franco</li>
            <li><span className="muestra muestra-ahora" /> Ahora</li>
            {vista === 'dia' && <li className="leyenda-ayuda">Tocá un espacio libre para cargar un turno</li>}
          </ul>
        </section>
      </div>
    </div>
  )
}
