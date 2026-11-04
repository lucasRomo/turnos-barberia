import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, List, Plus } from 'lucide-react'
import { negocio } from '../config/negocio'
import { ahoraMin, aMin, capital, deClave, fechaLarga, hora, hoyClave, mesAño, pesos, sumarDias } from '../lib/formato'
import { franjas, useDemo } from '../lib/store'
import { estados, type Turno } from '../lib/tipos'
import CalendarioMovil from './CalendarioMovil'
import { Persona, useAdmin, useIndices, type Alcance } from './comun'

const diasCortos = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

type Fila = { tipo: 'turno'; t: Turno } | { tipo: 'libre'; inicio: number; fin: number; barberoId: string } | { tipo: 'ahora'; inicio: number }

type Vista = 'calendario' | 'lista'
const leerVista = (): Vista => {
  try {
    return localStorage.getItem('agenda-vista') === 'lista' ? 'lista' : 'calendario'
  } catch {
    return 'calendario'
  }
}

/**
 * La agenda en el celular: una tira de días y los barberos arriba; abajo el día como calendario
 * (una columna por barbero) o como lista con los huecos libres entre turno y turno.
 */
export default function AgendaMovil({ dia, alcance, ir }: { dia: string; alcance: Alcance; ir: (c: Record<string, string>) => void }) {
  const e = useDemo()
  const ix = useIndices(e)
  const { verTurno, nuevoTurno } = useAdmin()
  const hoy = hoyClave()
  const ahora = ahoraMin()
  const [quien, setQuien] = useState<string>('todos')
  const [vista, setVista] = useState<Vista>(leerVista)
  const cambiarVista = (v: Vista) => {
    setVista(v)
    try {
      localStorage.setItem('agenda-vista', v)
    } catch {
      /* sin almacenamiento */
    }
  }
  const sucursales = negocio.sucursales.filter((s) => alcance === 'todas' || s.id === alcance)
  const equipo = e.equipo.filter((b) => sucursales.some((s) => s.id === b.sucursal))
  const barbero = equipo.find((b) => b.id === quien) ?? null
  const dow = deClave(dia).getDay()

  // Cuatro semanas: la pasada y tres para adelante
  const dias = useMemo(() => Array.from({ length: 28 }, (_, i) => sumarDias(hoy, i - 7)), [hoy])
  const tira = useRef<HTMLDivElement>(null)
  useEffect(() => {
    tira.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [dia])

  const delAlcance = (t: Turno) => t.estado !== 'cancelado' && sucursales.some((s) => s.id === t.sucursal)
  const porDia = useMemo(() => {
    const m: Record<string, number> = {}
    for (const t of e.turnos) if (delAlcance(t) && (!barbero || t.barberoId === barbero.id)) m[t.dia] = (m[t.dia] ?? 0) + 1
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e.turnos, alcance, barbero])

  const turnos = e.turnos
    .filter((t) => t.dia === dia && delAlcance(t) && (!barbero || t.barberoId === barbero.id))
    .sort((a, b) => a.inicio - b.inicio)
  const porBarbero = Object.fromEntries(equipo.map((b) => [b.id, e.turnos.filter((t) => t.dia === dia && delAlcance(t) && t.barberoId === b.id).length]))
  const total = turnos.reduce((s, t) => s + t.precio, 0)
  const atendidos = turnos.filter((t) => t.estado === 'atendido').length

  // Con un barbero elegido se ven sus huecos: tocás uno y cargás el turno ahí
  const franco = barbero && barbero.franco === dow
  const filas: Fila[] = turnos.map((t) => ({ tipo: 'turno', t }))
  if (barbero && !franco) {
    for (const [a, b] of franjas(barbero.sucursal, dia).map(([x, y]) => [aMin(x), aMin(y)])) {
      let desde = dia === hoy ? Math.max(a, Math.ceil(ahora / 15) * 15) : a
      if (dia < hoy) continue
      for (const t of turnos.filter((x) => x.inicio + x.duracion > desde && x.inicio < b)) {
        if (t.inicio - desde >= 30) filas.push({ tipo: 'libre', inicio: desde, fin: t.inicio, barberoId: barbero.id })
        desde = Math.max(desde, t.inicio + t.duracion)
      }
      if (b - desde >= 30) filas.push({ tipo: 'libre', inicio: desde, fin: b, barberoId: barbero.id })
    }
  }
  if (dia === hoy) filas.push({ tipo: 'ahora', inicio: ahora })
  filas.sort((x, y) => (x.tipo === 'turno' ? x.t.inicio : x.inicio) - (y.tipo === 'turno' ? y.t.inicio : y.inicio) || (x.tipo === 'ahora' ? -1 : 0))

  const cerrado = sucursales.every((s) => franjas(s.id, dia).length === 0)

  return (
    <div className="pantalla am">
      <div className="am-cabeza">
        <div>
          <h1>Agenda</h1>
          <p>{capital(mesAño(dia))}</p>
        </div>
        <div className="am-acciones">
          <button className="boton" onClick={() => ir({ dia: hoy })} disabled={dia === hoy}>
            Hoy
          </button>
          <div className="am-vistas" role="tablist" aria-label="Cómo ver el día">
            <button role="tab" aria-selected={vista === 'calendario'} className={vista === 'calendario' ? 'activa' : ''} onClick={() => cambiarVista('calendario')} aria-label="Calendario">
              <CalendarDays size={18} aria-hidden="true" />
            </button>
            <button role="tab" aria-selected={vista === 'lista'} className={vista === 'lista' ? 'activa' : ''} onClick={() => cambiarVista('lista')} aria-label="Lista">
              <List size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {negocio.sucursales.length > 1 && (
        <div className="am-sucursales" role="tablist" aria-label="Sucursal">
          {(['todas', ...negocio.sucursales.map((s) => s.id)] as Alcance[]).map((s) => (
            <button key={s} role="tab" aria-selected={alcance === s} className={alcance === s ? 'activa' : ''} onClick={() => { ir({ suc: s }); setQuien('todos') }}>
              {s === 'todas' ? 'Las dos' : negocio.sucursales.find((x) => x.id === s)!.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="am-dias" ref={tira} role="tablist" aria-label="Día">
        {dias.map((d) => {
          const n = porDia[d] ?? 0
          return (
            <button
              key={d}
              role="tab"
              aria-selected={d === dia}
              className={`${d === dia ? 'activa' : ''} ${d === hoy ? 'es-hoy' : ''} ${d < hoy ? 'pasado' : ''}`}
              onClick={() => ir({ dia: d })}
              aria-label={`${fechaLarga(d)}, ${n} turnos`}
            >
              <span>{d === hoy ? 'Hoy' : diasCortos[deClave(d).getDay()]}</span>
              <strong>{Number(d.slice(8))}</strong>
              <i className="am-carga" aria-hidden="true">
                {Array.from({ length: Math.min(3, Math.ceil(n / 4)) }, (_, k) => (
                  <b key={k} />
                ))}
              </i>
            </button>
          )
        })}
      </div>

      <div className="am-barberos" role="tablist" aria-label="Barbero">
        <button role="tab" aria-selected={!barbero} className={!barbero ? 'activa' : ''} onClick={() => setQuien('todos')}>
          <span className="am-todos" aria-hidden="true">{equipo.length}</span>
          Todos
        </button>
        {equipo.map((b) => (
          <button key={b.id} role="tab" aria-selected={barbero?.id === b.id} className={barbero?.id === b.id ? 'activa' : ''} onClick={() => setQuien(b.id)}>
            <Persona b={b} chico />
            {b.nombre}
            <small>{b.franco === dow ? 'franco' : porBarbero[b.id]}</small>
          </button>
        ))}
      </div>

      <p className="am-resumen">
        <strong>{capital(fechaLarga(dia))}</strong>
        <span>
          {turnos.length} {turnos.length === 1 ? 'turno' : 'turnos'}, {atendidos} atendidos, {pesos(total)}
        </span>
      </p>

      {vista === 'calendario' && !cerrado ? (
        <CalendarioMovil dia={dia} barberos={barbero ? [barbero] : equipo} turnos={turnos} />
      ) : cerrado ? (
        <p className="am-vacio">{alcance === 'todas' ? 'Las dos sucursales cierran' : 'La sucursal cierra'} este día.</p>
      ) : franco ? (
        <p className="am-vacio">
          {barbero!.nombre} tiene franco los {fechaLarga(dia).split(' ')[0]}.
        </p>
      ) : filas.filter((f) => f.tipo !== 'ahora').length === 0 ? (
        <div className="am-vacio">
          <p>No hay turnos cargados.</p>
          <button className="boton boton-primario" onClick={() => nuevoTurno({ dia, ...(barbero ? { barberoId: barbero.id, sucursal: barbero.sucursal } : {}) })}>
            <Plus size={16} aria-hidden="true" /> Cargar turno
          </button>
        </div>
      ) : (
        <ol className="am-lista">
          {filas.map((f, i) => {
            if (f.tipo === 'ahora')
              return (
                <li key="ahora" className="am-ahora" aria-label={`Ahora, ${hora(f.inicio)}`}>
                  <span>{hora(f.inicio)}</span>
                </li>
              )
            if (f.tipo === 'libre')
              return (
                <li key={`l${i}`}>
                  <button className="am-libre" onClick={() => nuevoTurno({ dia, inicio: f.inicio, barberoId: f.barberoId, sucursal: barbero!.sucursal })}>
                    <span className="am-hora">{hora(f.inicio)}</span>
                    <span>
                      Libre hasta las {hora(f.fin)}
                      <small>{f.fin - f.inicio >= 60 ? `${Math.floor((f.fin - f.inicio) / 60)} h${(f.fin - f.inicio) % 60 ? ` ${(f.fin - f.inicio) % 60} min` : ''}` : `${f.fin - f.inicio} min`}</small>
                    </span>
                    <Plus size={18} aria-hidden="true" />
                  </button>
                </li>
              )
            const t = f.t
            const b = ix.barbero[t.barberoId]
            const enCurso = dia === hoy && t.estado === 'reservado' && ahora >= t.inicio && ahora < t.inicio + t.duracion
            const estado = enCurso ? 'en-curso' : t.estado
            return (
              <li key={t.id}>
                <button className={`am-turno am-${estado}`} onClick={() => verTurno(t.id)}>
                  <span className="am-hora">
                    {hora(t.inicio)}
                    <small>{hora(t.inicio + t.duracion)}</small>
                  </span>
                  <span className="am-cuerpo">
                    <strong>{ix.cliente[t.clienteId]?.nombre ?? 'Cliente'}</strong>
                    <span>{ix.servicio[t.servicioId]?.nombre}</span>
                    {!barbero && (
                      <span className="am-quien">
                        <Persona b={b} chico />
                        {b.nombre}
                        {alcance === 'todas' && `, ${negocio.sucursales.find((s) => s.id === t.sucursal)!.nombre}`}
                      </span>
                    )}
                  </span>
                  <span className="am-lado">
                    <span className="am-estado">{enCurso ? 'En curso' : estados[t.estado]}</span>
                    <b>{pesos(t.precio)}</b>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
      <button
        className="am-mas"
        onClick={() => nuevoTurno({ dia, ...(barbero ? { barberoId: barbero.id, sucursal: barbero.sucursal } : {}) })}
        aria-label="Cargar un turno"
      >
        <Plus size={26} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </div>
  )
}
