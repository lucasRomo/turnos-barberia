// Genera datos de demo creíbles alrededor de la fecha de hoy:
// 75 días de historia y dos semanas de agenda por delante.
import { negocio, type Servicio } from '../config/negocio'
import { aMin, ahoraMin, deClave, hoyClave, sumarDias } from './formato'
import type { Cliente, Estado, MetodoPago, Movimiento, Origen, Turno, EnEspera } from './tipos'

export const VERSION = 6

function azar(semilla: number) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const nombres = [
  'Matías', 'Lucas', 'Franco', 'Nicolás', 'Santiago', 'Tomás', 'Joaquín', 'Facundo', 'Agustín', 'Bruno',
  'Gonzalo', 'Ignacio', 'Lautaro', 'Valentín', 'Thiago', 'Mateo', 'Julián', 'Ramiro', 'Emiliano', 'Diego',
  'Sebastián', 'Marcos', 'Federico', 'Juan Cruz', 'Benjamín', 'Martín', 'Pablo', 'Ezequiel', 'Rodrigo', 'Lisandro',
  'Bautista', 'Felipe', 'Gastón', 'Hernán', 'Iván', 'Leandro', 'Maximiliano', 'Nahuel', 'Octavio', 'Germán',
  'Camila', 'Sofía', 'Valentina', 'Martina', 'Lucía',
]
const apellidos = [
  'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Díaz', 'Pérez', 'Gómez', 'Sánchez', 'Romero',
  'Sosa', 'Álvarez', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Acosta', 'Benítez', 'Medina', 'Herrera',
  'Aguirre', 'Pereyra', 'Gutiérrez', 'Giménez', 'Molina', 'Ríos', 'Ferreyra', 'Bustos', 'Ledesma', 'Vera',
]
const notas = [
  'Degradé bajo, 1 a los costados.',
  'Arriba largo con tijera. No rebajar patillas.',
  'Barba en punta, perfilar cuello.',
  'Siempre con Blas. Prefiere los sábados a la mañana.',
  'Cabello fino: no usar máquina en la coronilla.',
  'Trae al hijo (8 años) los mismos días.',
  'Raya al costado marcada a navaja.',
  'Alérgico a la cera con perfume.',
]

function elegir<T>(r: () => number, lista: readonly T[]) {
  return lista[Math.floor(r() * lista.length)]
}

function ponderado<T>(r: () => number, opciones: [T, number][]) {
  const total = opciones.reduce((s, [, p]) => s + p, 0)
  let x = r() * total
  for (const [v, p] of opciones) {
    x -= p
    if (x <= 0) return v
  }
  return opciones[opciones.length - 1][0]
}

export function generar(): Estado {
  const hoy = hoyClave()
  const ahora = ahoraMin()
  const r = azar(Number(hoy.replace(/-/g, '')))
  const servicios: Servicio[] = negocio.servicios.map((s) => ({ ...s }))
  const equipo = negocio.equipo.map((b) => ({ ...b }))
  const productos = negocio.productos.map((p) => ({ ...p }))
  const porId = Object.fromEntries(servicios.map((s) => [s.id, s]))

  // Clientes
  const clientes: Cliente[] = []
  const usados = new Set<string>()
  while (clientes.length < 160) {
    const n = `${elegir(r, nombres)} ${elegir(r, apellidos)}`
    if (usados.has(n)) continue
    usados.add(n)
    clientes.push({
      id: `c${clientes.length + 1}`,
      nombre: n,
      telefono: `3541 ${Math.floor(40 + r() * 59)}-${String(Math.floor(r() * 10000)).padStart(4, '0')}`,
      nota: r() < 0.22 ? elegir(r, notas) : undefined,
      alta: sumarDias(hoy, -Math.floor(r() * 700) - 80),
    })
  }
  // Algunos clientes nuevos en el último mes
  for (let i = 0; i < 18; i++) clientes[clientes.length - 1 - i].alta = sumarDias(hoy, -Math.floor(r() * 28))
  // Clientes frecuentes: más chances de volver
  const peso = clientes.map(() => (r() < 0.3 ? 5 : 1))
  const pesoTotal = peso.reduce((a, b) => a + b, 0)
  const clienteAzar = (dia: string) => {
    for (let intento = 0; intento < 6; intento++) {
      let x = r() * pesoTotal
      for (let i = 0; i < clientes.length; i++) {
        x -= peso[i]
        if (x <= 0) {
          if (clientes[i].alta <= dia) return clientes[i].id
          break
        }
      }
    }
    return clientes[0].id
  }

  const turnos: Turno[] = []
  const movimientos: Movimiento[] = []
  let numero = 4100

  const mixServicios: [string, number][] = [
    ['corte', 50], ['corte-barba', 27], ['barba', 7], ['corte-nino', 9], ['color', 4], ['mechas', 3],
  ]
  const mixPago: [MetodoPago, number][] = [['efectivo', 34], ['transferencia', 31], ['mercadopago', 25], ['debito', 10]]
  const mixOrigen: [Origen, number][] = [['web', 46], ['whatsapp', 30], ['mostrador', 24]]

  for (let d = -75; d <= 14; d++) {
    const dia = sumarDias(hoy, d)
    const dow = deClave(dia).getDay()
    for (const b of equipo) {
      const suc = negocio.sucursales.find((s) => s.id === b.sucursal)!
      const franjas = suc.horario[dow]
      if (!franjas) continue
      if (b.franco === dow) continue
      let ocupacion = d < 0 ? 0.74 : d === 0 ? 0.8 : Math.max(0.12, 0.66 - d * 0.04)
      if (dow === 6) ocupacion += 0.12
      if (dow === 5) ocupacion += 0.06
      for (const [desde, hasta] of franjas) {
        let t = aMin(desde)
        const fin = aMin(hasta)
        while (t + 30 <= fin) {
          if (r() > ocupacion) {
            t += 30
            continue
          }
          let sid = ponderado(r, mixServicios)
          if (porId[sid].duracion > fin - t) sid = r() < 0.6 ? 'corte' : 'corte-barba'
          const s = porId[sid]
          if (s.duracion > fin - t) break
          let estado: Turno['estado'] = 'reservado'
          const terminado = d < 0 || (d === 0 && t + s.duracion <= ahora)
          if (terminado) estado = ponderado(r, [['atendido', 93], ['ausente', 4], ['cancelado', 3]])
          else if (r() < 0.03) estado = 'cancelado'
          const turno: Turno = {
            id: `t${++numero}`,
            numero,
            clienteId: clienteAzar(dia),
            barberoId: b.id,
            servicioId: sid,
            sucursal: b.sucursal,
            dia,
            inicio: t,
            duracion: s.duracion,
            precio: s.precio,
            estado,
            origen: ponderado(r, mixOrigen),
          }
          if (estado === 'atendido') turno.pago = ponderado(r, mixPago)
          turnos.push(turno)
          t += Math.ceil(s.duracion / 30) * 30
        }
      }
    }
    // Venta de productos y egresos de los días pasados
    if (d <= 0) {
      for (const suc of negocio.sucursales) {
        const franjas = suc.horario[dow]
        if (!franjas) continue
        const ventas = Math.floor(r() * (suc.id === 'nuevo' ? 4 : 2))
        for (let i = 0; i < ventas; i++) {
          const p = elegir(r, productos)
          const h = aMin(franjas[0][0]) + 30 + Math.floor(r() * 300)
          if (d === 0 && h > ahora) continue
          movimientos.push({
            id: `m${movimientos.length + 1}`, dia, hora: h, sucursal: suc.id, tipo: 'producto',
            concepto: p.nombre, monto: p.precio, metodo: ponderado(r, mixPago),
          })
        }
        if (r() < 0.18 && !(d === 0 && aMin(franjas[0][0]) + 15 > ahora)) {
          movimientos.push({
            id: `m${movimientos.length + 1}`, dia, hora: aMin(franjas[0][0]) + 15, sucursal: suc.id, tipo: 'egreso',
            concepto: elegir(r, ['Lavandería de toallas', 'Insumos: hojas de afeitar', 'Café y azúcar', 'Productos de limpieza']),
            monto: -Math.round((3000 + r() * 12000) / 500) * 500, metodo: 'efectivo',
          })
        }
      }
    }
  }

  // Clientes que esperan por orden de llegada, si hoy está abierto
  const espera: EnEspera[] = []
  const nuevo = negocio.sucursales[0]
  const franjasHoy = nuevo.horario[new Date().getDay()]
  if (franjasHoy?.some(([a, b]) => ahora >= aMin(a) && ahora < aMin(b) - 30)) {
    espera.push(
      { id: 'e1', nombre: 'Gonzalo P.', servicioId: 'corte', sucursal: 'nuevo', llegada: ahora - 14 },
      { id: 'e2', nombre: 'Tobías', servicioId: 'corte-barba', sucursal: 'nuevo', llegada: ahora - 6 },
    )
  }

  // Cajas de días anteriores ya cerradas
  const cajaCerrada: string[] = []
  for (let d = -75; d < 0; d++) for (const s of negocio.sucursales) cajaCerrada.push(`${sumarDias(hoy, d)}|${s.id}`)

  return {
    version: VERSION,
    generado: hoy,
    clientes,
    turnos,
    movimientos,
    espera,
    servicios,
    equipo,
    productos,
    cajaCerrada,
    ultimoNumero: numero,
  }
}
