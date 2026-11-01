import { useMemo, useState } from 'react'
import { deClave, diaMes, hoyClave, pct, pesos, sumarDias, num } from '../lib/formato'
import { useDemo } from '../lib/store'
import { origenes } from '../lib/tipos'
import { Barras, enAlcance, nombreAlcance, Persona, useAdmin } from './comun'

const periodos = [
  { dias: 7, texto: '7 días' },
  { dias: 30, texto: '30 días' },
  { dias: 60, texto: '60 días' },
]

export default function Reportes() {
  const e = useDemo()
  const { alcance } = useAdmin()
  const [dias, setDias] = useState(30)
  const hoy = hoyClave()

  const r = useMemo(() => {
    const filtro = enAlcance(alcance)
    const desde = sumarDias(hoy, -dias + 1)
    const desdeAntes = sumarDias(desde, -dias)
    const enRango = (a: string, b: string) => (t: { dia: string }) => t.dia >= a && t.dia <= b
    const todos = e.turnos.filter((t) => filtro(t) && enRango(desde, hoy)(t))
    const hechos = todos.filter((t) => t.estado === 'atendido')
    const antes = e.turnos.filter((t) => filtro(t) && enRango(desdeAntes, sumarDias(desde, -1))(t) && t.estado === 'atendido')
    const productos = e.movimientos.filter((m) => filtro(m) && m.tipo === 'producto' && enRango(desde, hoy)(m)).reduce((s, m) => s + m.monto, 0)
    const facturado = hechos.reduce((s, t) => s + t.precio, 0)
    const facturadoAntes = antes.reduce((s, t) => s + t.precio, 0)
    const porDia = Array.from({ length: dias }, (_, i) => {
      const d = sumarDias(desde, i)
      const v = hechos.filter((t) => t.dia === d).reduce((s, t) => s + t.precio, 0)
      return { etiqueta: diaMes(d), valor: v, detalle: `${diaMes(d)} · ${hechos.filter((t) => t.dia === d).length} turnos` }
    })
    const porBarbero = e.equipo
      .filter((b) => alcance === 'todas' || b.sucursal === alcance)
      .map((b) => {
        const suyos = hechos.filter((t) => t.barberoId === b.id)
        const total = suyos.reduce((s, t) => s + t.precio, 0)
        const ausentes = todos.filter((t) => t.barberoId === b.id && t.estado === 'ausente').length
        return { b, turnos: suyos.length, total, comision: Math.round((total * b.comision) / 100), ausentes, ticket: suyos.length ? total / suyos.length : 0 }
      })
      .sort((a, b) => b.total - a.total)
    const porServicio = e.servicios
      .map((s) => {
        const suyos = hechos.filter((t) => t.servicioId === s.id)
        return { s, n: suyos.length, total: suyos.reduce((x, t) => x + t.precio, 0) }
      })
      .sort((a, b) => b.total - a.total)
    const conOrigen = todos.filter((t) => t.estado !== 'cancelado')
    const porOrigen = Object.entries(origenes).map(([k, v]) => ({ v, n: conOrigen.filter((t) => t.origen === k).length }))
    const ausentes = todos.filter((t) => t.estado === 'ausente').length
    const pasados = todos.filter((t) => t.estado !== 'reservado').length
    console.assert(porBarbero.reduce((s, x) => s + x.total, 0) === facturado, 'Los barberos no suman el total')
    return { facturado, facturadoAntes, productos, hechos, porDia, porBarbero, porServicio, porOrigen, ausentes, pasados, conOrigen }
  }, [e, alcance, dias, hoy])

  const cambio = r.facturadoAntes ? (r.facturado - r.facturadoAntes) / r.facturadoAntes : 0
  const ticket = r.hechos.length ? r.facturado / r.hechos.length : 0
  const maxServicio = Math.max(1, ...r.porServicio.map((x) => x.total))

  return (
    <div className="pantalla">
      <div className="titulo-fila">
        <div>
          <h1>Reportes</h1>
          <p>{nombreAlcance(alcance)} · últimos {dias} días contra los {dias} anteriores</p>
        </div>
        <div className="segmentos" role="tablist" aria-label="Período">
          {periodos.map((p) => (
            <button key={p.dias} role="tab" aria-selected={dias === p.dias} className={dias === p.dias ? 'activa' : ''} onClick={() => setDias(p.dias)}>{p.texto}</button>
          ))}
        </div>
      </div>

      <div className="kpis">
        <div className="kpi">
          <span>Facturado en servicios</span>
          <strong>{pesos(r.facturado)}</strong>
          <small className={cambio >= 0 ? 'bien' : 'mal'}>{cambio >= 0 ? '+' : '−'}{pct(Math.abs(cambio))} contra los {dias} días anteriores ({pesos(r.facturadoAntes)})</small>
        </div>
        <div className="kpi">
          <span>Turnos atendidos</span>
          <strong>{num(r.hechos.length)}</strong>
          <small>{num(Math.round(r.hechos.length / dias))} por día en promedio</small>
        </div>
        <div className="kpi">
          <span>Ticket promedio</span>
          <strong>{pesos(Math.round(ticket))}</strong>
          <small>{pesos(r.productos)} extra en productos</small>
        </div>
        <div className="kpi">
          <span>No vinieron</span>
          <strong>{pct(r.pasados ? r.ausentes / r.pasados : 0)}</strong>
          <small>{r.ausentes} turnos perdidos de {r.pasados}</small>
        </div>
      </div>

      <section className="tarjeta">
        <div className="tarjeta-cabeza">
          <h2>Facturación por día</h2>
          <p className="ayuda"><span className="muestra muestra-ahora muestra-ancha" /> Sábados, el día más fuerte</p>
        </div>
        <Barras datos={r.porDia} alto={220} resaltar={(i) => deClave(sumarDias(hoy, -dias + 1 + i)).getDay() === 6} />
      </section>

      <div className="grilla-2">
        <section className="tarjeta">
          <div className="tarjeta-cabeza">
            <h2>Por barbero y comisiones</h2>
          </div>
          <table className="tabla">
            <thead>
              <tr><th>Barbero</th><th className="num">Turnos</th><th className="num">Facturado</th><th className="num">Comisión</th></tr>
            </thead>
            <tbody>
              {r.porBarbero.map((x) => (
                <tr key={x.b.id}>
                  <td><span className="con-persona"><Persona b={x.b} chico /> {x.b.nombre}</span></td>
                  <td className="num">{x.turnos}</td>
                  <td className="num">{pesos(x.total)}</td>
                  <td className="num">{pesos(x.comision)} <small className="tenue">{x.b.comision}%</small></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td className="num">{r.porBarbero.reduce((s, x) => s + x.turnos, 0)}</td>
                <td className="num">{pesos(r.facturado)}</td>
                <td className="num">{pesos(r.porBarbero.reduce((s, x) => s + x.comision, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <section className="tarjeta">
          <div className="tarjeta-cabeza">
            <h2>Servicios que más facturan</h2>
          </div>
          <ul className="ranking">
            {r.porServicio.map((x) => (
              <li key={x.s.id}>
                <span className="ranking-nombre">{x.s.nombre}<small>{x.n} turnos</small></span>
                <span className="ranking-barra"><span style={{ width: `${(x.total / maxServicio) * 100}%` }} /></span>
                <span className="ranking-valor">{pesos(x.total)}</span>
              </li>
            ))}
          </ul>
          <h3 className="subtitulo">Cómo reservan</h3>
          <ul className="ranking">
            {r.porOrigen.map((x) => (
              <li key={x.v}>
                <span className="ranking-nombre">{x.v}</span>
                <span className="ranking-barra ranking-gris"><span style={{ width: `${(x.n / Math.max(1, r.conOrigen.length)) * 100}%` }} /></span>
                <span className="ranking-valor">{pct(x.n / Math.max(1, r.conOrigen.length))}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <p className="ayuda">Montos de turnos cobrados. Las comisiones se calculan sobre lo que facturó cada barbero.</p>
    </div>
  )
}
