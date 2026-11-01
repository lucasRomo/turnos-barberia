import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { negocio } from '../config/negocio'
import { diaMes, hoyClave, hora, pesos, sumarDias, deClave } from '../lib/formato'
import { actualizarCliente, useDemo } from '../lib/store'
import { Dialogo } from '../lib/ui'
import { Marca, Persona, useAdmin, useIndices } from './comun'

type Pestana = 'todos' | 'frecuentes' | 'nuevos' | 'recuperar'

const pestanas: { id: Pestana; texto: string }[] = [
  { id: 'todos', texto: 'Todos' },
  { id: 'frecuentes', texto: 'Frecuentes' },
  { id: 'nuevos', texto: 'Nuevos este mes' },
  { id: 'recuperar', texto: 'Hace más de 45 días que no vienen' },
]

export default function Clientes() {
  const e = useDemo()
  const ix = useIndices(e)
  const { verTurno } = useAdmin()
  const [q, setQ] = useSearchParams()
  const [pestana, setPestana] = useState<Pestana>('todos')
  const [buscar, setBuscar] = useState('')
  const [cuantos, setCuantos] = useState(40)
  const hoy = hoyClave()
  const abierto = q.get('id')

  const filas = useMemo(() => {
    const porCliente: Record<string, typeof e.turnos> = {}
    for (const t of e.turnos) (porCliente[t.clienteId] ??= []).push(t)
    return e.clientes.map((c) => {
      const ts = (porCliente[c.id] ?? []).sort((a, b) => (a.dia + a.inicio).localeCompare(b.dia + b.inicio))
      const hechos = ts.filter((t) => t.estado === 'atendido')
      const ultima = hechos[hechos.length - 1]
      const proximo = ts.find((t) => t.estado === 'reservado' && t.dia >= hoy)
      const conteo: Record<string, number> = {}
      hechos.forEach((t) => (conteo[t.barberoId] = (conteo[t.barberoId] ?? 0) + 1))
      const habitual = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0]
      return {
        c, ts, visitas: hechos.length, gastado: hechos.reduce((s, t) => s + t.precio, 0),
        ultima: ultima?.dia, proximo, habitual: habitual ? ix.barbero[habitual] : undefined,
      }
    })
  }, [e.turnos, e.clientes, hoy, ix.barbero])

  const limite45 = sumarDias(hoy, -45)
  const visibles = filas
    .filter((f) => {
      if (buscar && !`${f.c.nombre} ${f.c.telefono}`.toLowerCase().includes(buscar.toLowerCase())) return false
      if (pestana === 'frecuentes') return f.visitas >= 5
      if (pestana === 'nuevos') return f.c.alta.slice(0, 7) === hoy.slice(0, 7)
      if (pestana === 'recuperar') return f.visitas >= 2 && !!f.ultima && f.ultima < limite45 && !f.proximo
      return true
    })
    .sort((a, b) => (b.ultima ?? '').localeCompare(a.ultima ?? ''))

  const conteos: Record<Pestana, number> = {
    todos: filas.length,
    frecuentes: filas.filter((f) => f.visitas >= 5).length,
    nuevos: filas.filter((f) => f.c.alta.slice(0, 7) === hoy.slice(0, 7)).length,
    recuperar: filas.filter((f) => f.visitas >= 2 && !!f.ultima && f.ultima < limite45 && !f.proximo).length,
  }

  const detalle = filas.find((f) => f.c.id === abierto)
  const diasDesde = (k: string) => Math.round((deClave(hoy).getTime() - deClave(k).getTime()) / 86400000)

  return (
    <div className="pantalla">
      <div className="titulo-fila">
        <div>
          <h1>Clientes</h1>
          <p>Cada reserva suma la ficha sola: visitas, gasto, barbero habitual y notas del corte.</p>
        </div>
      </div>

      <div className="pestanas-admin" role="tablist">
        {pestanas.map((p) => (
          <button key={p.id} role="tab" aria-selected={pestana === p.id} className={pestana === p.id ? 'activa' : ''} onClick={() => setPestana(p.id)}>
            {p.texto} <span className="cuenta">{conteos[p.id]}</span>
          </button>
        ))}
      </div>

      <div className="barra-herramientas">
        <input type="search" placeholder="Buscar por nombre o teléfono" value={buscar} onChange={(ev) => setBuscar(ev.target.value)} aria-label="Buscar clientes" />
        <span className="cuenta-texto">{visibles.length} clientes</span>
      </div>

      {pestana === 'recuperar' && visibles.length > 0 && (
        <p className="aviso aviso-suave">
          Son {visibles.length} clientes que venían seguido y dejaron de venir. Un mensaje con un descuento suele traer de vuelta a uno de cada cinco.
        </p>
      )}

      <table className="tabla tabla-clientes">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Barbero habitual</th>
            <th className="num">Visitas</th>
            <th className="num">Última visita</th>
            <th className="num">Gastado</th>
            <th>Próximo turno</th>
          </tr>
        </thead>
        <tbody>
          {visibles.slice(0, cuantos).map((f) => (
            <tr key={f.c.id} className="fila-clic" onClick={() => setQ({ id: f.c.id })}>
              <td>
                <strong>{f.c.nombre}</strong>
                <small>{f.c.telefono}</small>
              </td>
              <td>{f.habitual ? <span className="con-persona"><Persona b={f.habitual} chico /> {f.habitual.nombre}</span> : <span className="tenue">—</span>}</td>
              <td className="num">{f.visitas}</td>
              <td className="num">{f.ultima ? `${diaMes(f.ultima)} · hace ${diasDesde(f.ultima)} d` : <span className="tenue">—</span>}</td>
              <td className="num">{f.gastado ? pesos(f.gastado) : <span className="tenue">—</span>}</td>
              <td>{f.proximo ? `${diaMes(f.proximo.dia)}, ${hora(f.proximo.inicio)}` : <span className="tenue">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {visibles.length > cuantos && (
        <button className="boton boton-ancho" onClick={() => setCuantos(cuantos + 40)}>
          Ver {Math.min(40, visibles.length - cuantos)} más
        </button>
      )}

      <Dialogo abierto={!!detalle} cerrar={() => setQ({})} titulo={detalle?.c.nombre ?? ''} ancho={620}>
        {detalle && (
          <>
            <div className="kpis kpis-dialogo">
              <div className="kpi"><span>Visitas</span><strong>{detalle.visitas}</strong></div>
              <div className="kpi"><span>Gastado</span><strong>{pesos(detalle.gastado)}</strong></div>
              <div className="kpi"><span>Cliente desde</span><strong>{diaMes(detalle.c.alta)}</strong><small>{detalle.c.alta.slice(0, 4)}</small></div>
            </div>
            <label className="campo">
              Notas del corte
              <textarea
                rows={2}
                defaultValue={detalle.c.nota}
                placeholder="Ej.: degradé bajo, 1 a los costados"
                onBlur={(ev) => actualizarCliente(detalle.c.id, { nota: ev.target.value })}
              />
            </label>
            <div className="acciones-fila">
              <a
                className="boton"
                href={`https://wa.me/54${detalle.c.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${detalle.c.nombre.split(' ')[0]}! Te escribimos de ${negocio.nombre}.`)}`}
                target="_blank"
                rel="noreferrer"
              >
                Escribir por WhatsApp
              </a>
            </div>
            <h3 className="subtitulo">Historial</h3>
            <ul className="lista lista-historial">
              {[...detalle.ts].reverse().slice(0, 12).map((t) => (
                <li key={t.id}>
                  <button onClick={() => verTurno(t.id)}>
                    <span className="lista-hora">{diaMes(t.dia)}</span>
                    <span className="lista-texto">
                      {ix.servicio[t.servicioId].nombre}
                      <small>con {ix.barbero[t.barberoId].nombre} · {pesos(t.precio)}</small>
                    </span>
                    <Marca estado={t.estado} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Dialogo>
    </div>
  )
}
