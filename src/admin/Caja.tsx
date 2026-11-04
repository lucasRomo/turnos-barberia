import { useMemo, useState, type FormEvent } from 'react'
import { negocio, type SucursalId } from '../config/negocio'
import { ahoraMin, capital, fechaLarga, hora, hoyClave, pesos, sumarDias } from '../lib/formato'
import { agregarMovimiento, cerrarCaja, useDemo } from '../lib/store'
import { metodos, type MetodoPago } from '../lib/tipos'
import { Dialogo } from '../lib/ui'
import { useAdmin, useIndices } from './comun'

type Linea = { id: string; hora: number; concepto: string; detalle: string; metodo: MetodoPago; monto: number; turnoId?: string }

export default function Caja() {
  const e = useDemo()
  const ix = useIndices(e)
  const { alcance, verTurno } = useAdmin()
  const hoy = hoyClave()
  const [suc, setSuc] = useState<SucursalId>(alcance === 'todas' ? negocio.sucursales[0].id : alcance)
  // Arranca en el último día con movimientos (si hoy todavía no abrió, muestra ayer)
  const [dia, setDia] = useState(() => {
    for (let i = 0; i < 7; i++) {
      const d = sumarDias(hoy, -i)
      if (e.turnos.some((t) => t.dia === d && t.sucursal === suc && t.estado === 'atendido')) return d
    }
    return hoy
  })
  const [dialogo, setDialogo] = useState<'producto' | 'gasto' | null>(null)
  const cerrada = e.cajaCerrada.includes(`${dia}|${suc}`)

  const lineas = useMemo<Linea[]>(() => {
    const turnos: Linea[] = e.turnos
      .filter((t) => t.dia === dia && t.sucursal === suc && t.estado === 'atendido' && t.pago)
      .map((t) => ({
        id: t.id, turnoId: t.id, hora: t.inicio + t.duracion, metodo: t.pago!, monto: t.precio,
        concepto: ix.servicio[t.servicioId].nombre,
        detalle: `${ix.cliente[t.clienteId].nombre} con ${ix.barbero[t.barberoId].nombre}`,
      }))
    const movs: Linea[] = e.movimientos
      .filter((m) => m.dia === dia && m.sucursal === suc)
      .map((m) => ({ id: m.id, hora: m.hora, metodo: m.metodo, monto: m.monto, concepto: m.concepto, detalle: m.tipo === 'producto' ? 'Venta de producto' : 'Gasto' }))
    return [...turnos, ...movs].sort((a, b) => b.hora - a.hora)
  }, [e.turnos, e.movimientos, dia, suc, ix])

  const porMetodo = (Object.keys(metodos) as MetodoPago[]).map((m) => ({
    m, total: lineas.filter((l) => l.metodo === m).reduce((s, l) => s + l.monto, 0),
  }))
  const total = lineas.reduce((s, l) => s + l.monto, 0)
  const servicios = lineas.filter((l) => l.turnoId).reduce((s, l) => s + l.monto, 0)
  const productos = lineas.filter((l) => !l.turnoId && l.monto > 0).reduce((s, l) => s + l.monto, 0)
  const gastos = lineas.filter((l) => l.monto < 0).reduce((s, l) => s + l.monto, 0)
  console.assert(servicios + productos + gastos === total, 'La caja no cierra')

  return (
    <div className="pantalla">
      <div className="titulo-fila">
        <div>
          <h1>Caja</h1>
          <p>{capital(fechaLarga(dia))} · {negocio.sucursales.find((s) => s.id === suc)!.nombre} · {cerrada ? 'caja cerrada' : 'caja abierta'}</p>
        </div>
        <div className="controles">
          <div className="segmentos" role="tablist" aria-label="Sucursal">
            {negocio.sucursales.map((s) => (
              <button key={s.id} role="tab" aria-selected={suc === s.id} className={suc === s.id ? 'activa' : ''} onClick={() => setSuc(s.id)}>{s.nombre}</button>
            ))}
          </div>
          <div className="segmentos">
            <button onClick={() => setDia(sumarDias(dia, -1))} aria-label="Día anterior">←</button>
            <button onClick={() => setDia(hoy)} className={dia === hoy ? 'activa' : ''}>Hoy</button>
            <button onClick={() => setDia(sumarDias(dia, 1))} disabled={dia >= hoy} aria-label="Día siguiente">→</button>
          </div>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi kpi-principal">
          <span>Total del día</span>
          <strong>{pesos(total)}</strong>
          <small>{pesos(servicios)} en servicios · {pesos(productos)} en productos · {pesos(gastos)} en gastos</small>
        </div>
        {porMetodo.map(({ m, total }) => (
          <div className="kpi" key={m}>
            <span>{metodos[m]}</span>
            <strong>{total ? pesos(total) : '—'}</strong>
            <small>{lineas.filter((l) => l.metodo === m).length} movimientos</small>
          </div>
        ))}
      </div>

      <div className="barra-herramientas">
        <span className="cuenta-texto">{lineas.length} movimientos</span>
        <div className="acciones-fila">
          <button className="boton boton-chico" disabled={cerrada} onClick={() => setDialogo('producto')}>Vender producto</button>
          <button className="boton boton-chico" disabled={cerrada} onClick={() => setDialogo('gasto')}>Registrar gasto</button>
          <button className="boton boton-chico boton-primario" disabled={cerrada || dia > hoy} onClick={() => cerrarCaja(dia, suc)}>
            {cerrada ? 'Caja cerrada' : 'Cerrar caja'}
          </button>
        </div>
      </div>

      {lineas.length === 0 ? (
        <p className="vacio">Todavía no hay movimientos este día.</p>
      ) : (
        <table className="tabla tabla-caja">
          <thead>
            <tr><th className="num">Hora</th><th>Concepto</th><th>Medio de pago</th><th className="num">Monto</th></tr>
          </thead>
          <tbody>
            {lineas.map((l) => (
              <tr key={l.id} className={l.turnoId ? 'fila-clic' : ''} onClick={() => l.turnoId && verTurno(l.turnoId)}>
                <td className="num">{hora(Math.min(l.hora, 1439))}</td>
                <td><strong>{l.concepto}</strong><small>{l.detalle}</small></td>
                <td>{metodos[l.metodo]}</td>
                <td className={`num ${l.monto < 0 ? 'mal' : ''}`}>{l.monto < 0 ? '−' : ''}{pesos(Math.abs(l.monto))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td /><td>Total</td><td /><td className="num">{pesos(total)}</td></tr>
          </tfoot>
        </table>
      )}

      <Dialogo abierto={!!dialogo} cerrar={() => setDialogo(null)} titulo={dialogo === 'producto' ? 'Vender producto' : 'Registrar gasto'}>
        {dialogo && <FormMovimiento tipo={dialogo} dia={dia} suc={suc} cerrar={() => setDialogo(null)} />}
      </Dialogo>
    </div>
  )
}

function FormMovimiento({ tipo, dia, suc, cerrar }: { tipo: 'producto' | 'gasto'; dia: string; suc: SucursalId; cerrar: () => void }) {
  const e = useDemo()
  const [producto, setProducto] = useState(e.productos[0].id)
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
  const p = e.productos.find((x) => x.id === producto)!

  function guardar(ev: FormEvent) {
    ev.preventDefault()
    const h = dia === hoyClave() ? ahoraMin() : 1200
    if (tipo === 'producto') agregarMovimiento({ dia, hora: h, sucursal: suc, tipo: 'producto', concepto: p.nombre, monto: p.precio, metodo })
    else agregarMovimiento({ dia, hora: h, sucursal: suc, tipo: 'egreso', concepto, monto: -Math.abs(Number(monto)), metodo })
    cerrar()
  }

  return (
    <form className="formulario" onSubmit={guardar}>
      {tipo === 'producto' ? (
        <label className="campo">
          Producto
          <select value={producto} onChange={(ev) => setProducto(ev.target.value)}>
            {e.productos.map((x) => <option key={x.id} value={x.id} disabled={!x.stock}>{x.nombre} · {pesos(x.precio)} · quedan {x.stock}</option>)}
          </select>
        </label>
      ) : (
        <>
          <label className="campo">
            Concepto
            <input required value={concepto} onChange={(ev) => setConcepto(ev.target.value)} placeholder="Ej.: lavandería de toallas" />
          </label>
          <label className="campo">
            Monto
            <input required inputMode="numeric" value={monto} onChange={(ev) => setMonto(ev.target.value.replace(/\D/g, ''))} placeholder="5000" />
          </label>
        </>
      )}
      <label className="campo">
        Medio de pago
        <select value={metodo} onChange={(ev) => setMetodo(ev.target.value as MetodoPago)}>
          {Object.entries(metodos).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <div className="acciones-fila">
        <button type="button" className="boton" onClick={cerrar}>Cancelar</button>
        <button className="boton boton-primario">{tipo === 'producto' ? `Cobrar ${pesos(p.precio)}` : 'Guardar gasto'}</button>
      </div>
    </form>
  )
}
