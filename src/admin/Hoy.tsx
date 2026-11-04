import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { negocio } from '../config/negocio'
import { aMin, ahoraMin, capital, fechaLarga, hora, hoyClave, pesos, sumarDias } from '../lib/formato'
import { franjas, quitarEspera, sumarEspera, useDemo } from '../lib/store'
import { metodos } from '../lib/tipos'
import Carriles from './Carriles'
import { enAlcance, nombreAlcance, Persona, useAdmin, useIndices } from './comun'

export default function Hoy() {
  const e = useDemo()
  const ix = useIndices(e)
  const { alcance, verTurno, nuevoTurno } = useAdmin()
  const hoy = hoyClave()
  const ahora = ahoraMin()
  const semanaPasada = sumarDias(hoy, -7)

  const d = useMemo(() => {
    const filtro = enAlcance(alcance)
    const deHoy = e.turnos.filter((t) => t.dia === hoy && filtro(t) && t.estado !== 'cancelado')
    const cobrado = deHoy.filter((t) => t.estado === 'atendido').reduce((s, t) => s + t.precio, 0)
    const ventas = e.movimientos.filter((m) => m.dia === hoy && filtro(m) && m.tipo === 'producto').reduce((s, m) => s + m.monto, 0)
    const previsto = deHoy.filter((t) => t.estado === 'reservado').reduce((s, t) => s + t.precio, 0)
    // Mismo día de la semana pasada, hasta esta misma hora
    const antes =
      e.turnos
        .filter((t) => t.dia === semanaPasada && filtro(t) && t.estado === 'atendido' && t.inicio + t.duracion <= ahora)
        .reduce((s, t) => s + t.precio, 0) +
      e.movimientos
        .filter((m) => m.dia === semanaPasada && filtro(m) && m.tipo === 'producto' && m.hora <= ahora)
        .reduce((s, m) => s + m.monto, 0)
    const abiertoMin = negocio.sucursales
      .filter((s) => alcance === 'todas' || s.id === alcance)
      .reduce((m, s) => {
        const sillones = e.equipo.filter((b) => b.sucursal === s.id).length
        return m + franjas(s.id, hoy).reduce((x, [a, b]) => x + aMin(b) - aMin(a), 0) * sillones
      }, 0)
    const ocupado = deHoy.reduce((s, t) => s + t.duracion, 0)
    const proximos = deHoy.filter((t) => t.estado === 'reservado' && t.inicio + t.duracion > ahora).sort((a, b) => a.inicio - b.inicio)
    const mes = hoy.slice(0, 7)
    const nuevos = e.clientes.filter((c) => c.alta.startsWith(mes)).length
    const porMetodo = Object.keys(metodos).map((k) => ({
      metodo: k as keyof typeof metodos,
      total:
        deHoy.filter((t) => t.pago === k).reduce((s, t) => s + t.precio, 0) +
        e.movimientos.filter((m) => m.dia === hoy && filtro(m) && m.metodo === k).reduce((s, m) => s + m.monto, 0),
    }))
    return {
      deHoy, cobrado: cobrado + ventas, previsto, antes, ocupacion: abiertoMin ? ocupado / abiertoMin : 0,
      proximos, nuevos, porMetodo, atendidos: deHoy.filter((t) => t.estado === 'atendido').length,
    }
  }, [e, alcance, hoy, ahora, semanaPasada])

  const espera = e.espera.filter(enAlcance(alcance)).sort((a, b) => a.llegada - b.llegada)
  const stockBajo = e.productos.filter((p) => p.stock <= 4)
  const abiertasHoy = negocio.sucursales.filter((s) => (alcance === 'todas' || s.id === alcance) && franjas(s.id, hoy).length)
  const diferencia = d.cobrado - d.antes
  const aperturas = abiertasHoy.map((s) => aMin(franjas(s.id, hoy)[0][0]))
  const abreA = aperturas.length && Math.min(...aperturas) > ahora ? Math.min(...aperturas) : null

  // Espera estimada: lo que le falta al barbero más cerca de liberarse, más los que esperan antes
  const libreEn = (() => {
    const equipo = e.equipo.filter((b) => b.sucursal === (alcance === 'todas' ? negocio.sucursales[0].id : alcance))
    const fines = equipo.map((b) => {
      const enCurso = d.deHoy.find((t) => t.barberoId === b.id && t.inicio <= ahora && t.inicio + t.duracion > ahora)
      return enCurso ? enCurso.inicio + enCurso.duracion - ahora : 0
    })
    return Math.max(0, Math.min(...fines))
  })()

  return (
    <div className="pantalla">
      <div className="titulo-fila">
        <div>
          <h1>Hoy</h1>
          <p>
            {capital(fechaLarga(hoy))} ·{' '}
            {abiertasHoy.length
              ? abiertasHoy.map((s) => `${s.nombre} ${franjas(s.id, hoy).map(([a, b]) => `${a} a ${b}`).join(' y ')}`).join(' · ')
              : `${nombreAlcance(alcance)}: cerrado`}
          </p>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi">
          <span>Turnos de hoy</span>
          <strong>{d.deHoy.length}</strong>
          <small>{d.atendidos} atendidos, {d.deHoy.length - d.atendidos} por atender</small>
        </div>
        <div className="kpi">
          <span>Cobrado hasta ahora</span>
          <strong>{pesos(d.cobrado)}</strong>
          {abreA !== null ? (
            <small>Abre a las {hora(abreA)}</small>
          ) : (
            <small className={diferencia >= 0 ? 'bien' : 'mal'}>
              {diferencia >= 0 ? '+' : '−'}{pesos(Math.abs(diferencia))} contra el {fechaLarga(semanaPasada).split(' ')[0]} pasado a esta hora
            </small>
          )}
        </div>
        <div className="kpi">
          <span>Por cobrar hoy</span>
          <strong>{pesos(d.previsto)}</strong>
          <small>{d.proximos.length} turnos reservados</small>
        </div>
        <div className="kpi">
          <span>Ocupación de sillones</span>
          <strong>{Math.round(d.ocupacion * 100)}%</strong>
          <small>de las horas abiertas de hoy</small>
        </div>
      </div>

      {abiertasHoy.length > 0 && (
        <section aria-labelledby="ahora-titulo">
          <h2 id="ahora-titulo" className="rail-titulo">En el sillón ahora</h2>
          <ul className="sillones">
            {e.equipo
              .filter((b) => abiertasHoy.some((s) => s.id === b.sucursal))
              .map((b) => {
                const deFranco = b.franco === new Date(hoy + 'T12:00').getDay()
                const delBarbero = d.deHoy.filter((t) => t.barberoId === b.id).sort((x, y) => x.inicio - y.inicio)
                const actual = delBarbero.find((t) => t.inicio <= ahora && t.inicio + t.duracion > ahora && t.estado !== 'ausente')
                const proximo = delBarbero.find((t) => t.inicio > ahora && t.estado === 'reservado')
                const avance = actual ? (ahora - actual.inicio) / actual.duracion : 0
                const abiertaAhora = franjas(b.sucursal, hoy).some(([a, z]) => ahora >= aMin(a) && ahora < aMin(z))
                return (
                  <li key={b.id} className={`sillon ${actual ? 'sillon-ocupado' : ''}`} style={{ ['--tono' as string]: b.tono }}>
                    <div className="sillon-cabeza">
                      <Persona b={b} />
                      <span>
                        <strong>{b.nombre}</strong>
                        <small>{negocio.sucursales.find((s) => s.id === b.sucursal)!.nombre}</small>
                      </span>
                      <span className={`sillon-estado ${actual ? 'ocupado' : ''}`}>
                        {deFranco ? 'De franco' : !abiertaAhora ? 'Cerrado' : actual ? 'Atendiendo' : 'Libre'}
                      </span>
                    </div>
                    {actual ? (
                      <button className="sillon-turno" onClick={() => verTurno(actual.id)}>
                        <span>
                          {ix.cliente[actual.clienteId].nombre} · {ix.servicio[actual.servicioId].nombre}
                        </span>
                        <span className="sillon-progreso" aria-hidden="true">
                          <span style={{ width: `${Math.round(avance * 100)}%` }} />
                        </span>
                        <small>Termina {hora(actual.inicio + actual.duracion)} · faltan {actual.inicio + actual.duracion - ahora} min</small>
                      </button>
                    ) : (
                      <p className="sillon-libre">
                        {deFranco ? 'Vuelve mañana.' : proximo ? <>Próximo: <strong>{hora(proximo.inicio)}</strong> con {ix.cliente[proximo.clienteId].nombre.split(' ')[0]}</> : 'Sin más turnos hoy.'}
                      </p>
                    )}
                  </li>
                )
              })}
          </ul>
        </section>
      )}

      <div className="grilla-rail">
        <div className="columna">
          <section className="tarjeta solo-ancho">
            <div className="tarjeta-cabeza">
              <h2>Sillones de hoy</h2>
              <Link to="/admin/agenda" className="enlace-chico">Abrir agenda</Link>
            </div>
            <Carriles dia={hoy} alcance={alcance} alTurno={verTurno} alHueco={(barberoId, inicio) => {
              const b = e.equipo.find((x) => x.id === barberoId)!
              nuevoTurno({ sucursal: b.sucursal, dia: hoy, inicio, barberoId })
            }} />
          </section>

          <section className="tarjeta">
            <div className="tarjeta-cabeza">
              <h2>Sin turno, por orden de llegada</h2>
              <button
                className="boton boton-chico"
                onClick={() => sumarEspera({ nombre: `Cliente ${e.espera.length + 1}`, servicioId: 'corte', sucursal: alcance === 'todas' ? negocio.sucursales[0].id : alcance, llegada: ahora })}
              >
                Anotar cliente
              </button>
            </div>
            {espera.length === 0 ? (
              <p className="vacio">No hay nadie esperando. Cuando alguien llegue sin turno, anotalo acá y le decís cuánto falta.</p>
            ) : (
              <table className="tabla tabla-espera">
                <thead>
                  <tr><th>Cliente</th><th>Servicio</th><th className="num">Llegó</th><th className="num">Espera estimada</th><th /></tr>
                </thead>
                <tbody>
                  {espera.map((x, i) => (
                    <tr key={x.id}>
                      <td>{x.nombre}</td>
                      <td>{ix.servicio[x.servicioId]?.nombre}</td>
                      <td className="num">{hora(x.llegada)}</td>
                      <td className="num">{libreEn + i * 30} min</td>
                      <td className="num"><button className="boton boton-chico" onClick={() => quitarEspera(x.id)}>Pasó al sillón</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <aside className="rail">
          <h2 className="rail-titulo">Próximos turnos</h2>
          <div className="tarjeta tarjeta-lista">
            {d.proximos.length === 0 && <p className="vacio">No quedan turnos por hoy.</p>}
            <ul className="lista">
              {d.proximos.slice(0, 6).map((t) => {
                const c = ix.cliente[t.clienteId]
                const b = ix.barbero[t.barberoId]
                return (
                  <li key={t.id}>
                    <button onClick={() => verTurno(t.id)}>
                      <span className="lista-hora">{hora(t.inicio)}</span>
                      <span className="lista-texto">
                        {c.nombre}
                        <small>{ix.servicio[t.servicioId].nombre} con {b.nombre}</small>
                      </span>
                      <Persona b={b} chico />
                    </button>
                  </li>
                )
              })}
            </ul>
            <Link to="/admin/agenda" className="boton boton-chico boton-ancho">Ver toda la agenda</Link>
          </div>

          <h2 className="rail-titulo">Caja de hoy</h2>
          <div className="tarjeta">
            <dl className="ficha ficha-compacta">
              {d.porMetodo.map((m) => (
                <div key={m.metodo}><dt>{metodos[m.metodo]}</dt><dd>{m.total ? pesos(m.total) : '—'}</dd></div>
              ))}
              <div className="ficha-total"><dt>Total</dt><dd>{pesos(d.porMetodo.reduce((s, m) => s + m.total, 0))}</dd></div>
            </dl>
            <Link to="/admin/caja" className="boton boton-chico boton-ancho">Ir a la caja</Link>
          </div>

          <h2 className="rail-titulo">Este mes</h2>
          <div className="tarjeta">
            <dl className="ficha ficha-compacta">
              <div><dt>Clientes nuevos</dt><dd>{d.nuevos}</dd></div>
              {stockBajo.map((p) => (
                <div key={p.id}><dt>Quedan pocos: {p.nombre}</dt><dd className="mal">{p.stock} u.</dd></div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}
