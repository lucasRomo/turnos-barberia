// Estado de la demo: vive en el navegador (localStorage) para que lo que
// se reserva en la web aparezca en el panel. Se regenera cada día.
import { useSyncExternalStore } from 'react'
import { negocio, type SucursalId } from '../config/negocio'
import { aMin, ahoraMin, deClave, hoyClave, sumarDias } from './formato'
import { generar, VERSION } from './semilla'
import type { Cliente, EnEspera, Estado, MetodoPago, Movimiento, Turno } from './tipos'

const CLAVE = 'ayrton-demo'

function cargar(): Estado {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (crudo) {
      const e = JSON.parse(crudo) as Estado
      if (e.version === VERSION && e.generado === hoyClave()) return e
    }
  } catch {
    /* sin almacenamiento: seguimos con datos nuevos */
  }
  return generar()
}

let estado: Estado = cargar()
const oyentes = new Set<() => void>()

function guardar(nuevo: Estado) {
  estado = nuevo
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado))
  } catch {
    /* modo privado: la demo funciona igual, sin recordar */
  }
  oyentes.forEach((f) => f())
}

const suscribir = (f: () => void) => {
  oyentes.add(f)
  return () => {
    oyentes.delete(f)
  }
}

/** Estado completo; derivar con useMemo en cada pantalla. */
export function useDemo(): Estado {
  return useSyncExternalStore(suscribir, () => estado)
}

export const leer = () => estado

// ——— Acciones ———

export function reiniciarDemo() {
  guardar(generar())
}

export function crearCliente(datos: Omit<Cliente, 'id' | 'alta'>) {
  const existente = estado.clientes.find(
    (c) => c.telefono.replace(/\D/g, '') === datos.telefono.replace(/\D/g, '') && datos.telefono,
  )
  if (existente) return existente
  const cliente: Cliente = { ...datos, id: `c${Date.now()}`, alta: hoyClave() }
  guardar({ ...estado, clientes: [...estado.clientes, cliente] })
  return cliente
}

export function actualizarCliente(id: string, cambios: Partial<Cliente>) {
  guardar({ ...estado, clientes: estado.clientes.map((c) => (c.id === id ? { ...c, ...cambios } : c)) })
}

export function crearTurno(datos: Omit<Turno, 'id' | 'numero' | 'estado' | 'precio' | 'duracion'> & { nota?: string }) {
  const s = estado.servicios.find((x) => x.id === datos.servicioId)!
  const numero = estado.ultimoNumero + 1
  const turno: Turno = { ...datos, id: `t${numero}`, numero, estado: 'reservado', precio: s.precio, duracion: s.duracion }
  guardar({ ...estado, turnos: [...estado.turnos, turno], ultimoNumero: numero })
  return turno
}

export function actualizarTurno(id: string, cambios: Partial<Turno>) {
  guardar({ ...estado, turnos: estado.turnos.map((t) => (t.id === id ? { ...t, ...cambios } : t)) })
}

export function cobrarTurno(id: string, metodo: MetodoPago) {
  actualizarTurno(id, { estado: 'atendido', pago: metodo })
}

export function agregarMovimiento(m: Omit<Movimiento, 'id'>) {
  guardar({ ...estado, movimientos: [...estado.movimientos, { ...m, id: `m${Date.now()}` }] })
  if (m.tipo === 'producto') {
    const p = estado.productos.find((x) => x.nombre === m.concepto)
    if (p) actualizarProducto(p.id, { stock: Math.max(0, p.stock - 1) })
  }
}

export function actualizarProducto(id: string, cambios: Partial<Estado['productos'][number]>) {
  guardar({ ...estado, productos: estado.productos.map((p) => (p.id === id ? { ...p, ...cambios } : p)) })
}

export function actualizarServicio(id: string, cambios: Partial<Estado['servicios'][number]>) {
  guardar({ ...estado, servicios: estado.servicios.map((s) => (s.id === id ? { ...s, ...cambios } : s)) })
}

export function agregarServicio(s: Estado['servicios'][number]) {
  guardar({ ...estado, servicios: [...estado.servicios, s] })
}

export function actualizarBarbero(id: string, cambios: Partial<Estado['equipo'][number]>) {
  guardar({ ...estado, equipo: estado.equipo.map((b) => (b.id === id ? { ...b, ...cambios } : b)) })
}

export function sumarEspera(e: Omit<EnEspera, 'id'>) {
  guardar({ ...estado, espera: [...estado.espera, { ...e, id: `e${Date.now()}` }] })
}

export function quitarEspera(id: string) {
  guardar({ ...estado, espera: estado.espera.filter((e) => e.id !== id) })
}

export function cerrarCaja(dia: string, sucursal: SucursalId) {
  guardar({ ...estado, cajaCerrada: [...estado.cajaCerrada, `${dia}|${sucursal}`] })
}

// ——— Disponibilidad ———

export type Hueco = { inicio: number; barberoId: string }

export function franjas(sucursal: SucursalId, dia: string) {
  const s = negocio.sucursales.find((x) => x.id === sucursal)!
  return s.horario[deClave(dia).getDay()] ?? []
}

export function abierto(sucursal: SucursalId, dia: string) {
  return franjas(sucursal, dia).length > 0
}

/** Horarios libres para un servicio en un día, con el barbero elegido o cualquiera. */
export function huecos(e: Estado, sucursal: SucursalId, dia: string, servicioId: string, barberoId?: string): Hueco[] {
  const servicio = e.servicios.find((s) => s.id === servicioId)
  if (!servicio) return []
  const dow = deClave(dia).getDay()
  const equipo = e.equipo.filter((b) => b.sucursal === sucursal && b.franco !== dow && (!barberoId || b.id === barberoId))
  const ocupados = e.turnos.filter((t) => t.dia === dia && t.sucursal === sucursal && t.estado !== 'cancelado')
  const minimo = dia === hoyClave() ? ahoraMin() + 20 : 0
  const libres: Hueco[] = []
  for (const [desde, hasta] of franjas(sucursal, dia)) {
    for (let t = aMin(desde); t + servicio.duracion <= aMin(hasta); t += 30) {
      if (t < minimo) continue
      const b = equipo.find(
        (b) => !ocupados.some((o) => o.barberoId === b.id && o.inicio < t + servicio.duracion && t < o.inicio + o.duracion),
      )
      if (b) libres.push({ inicio: t, barberoId: b.id })
    }
  }
  return libres
}

/** Primer turno libre de corte desde ahora, buscando hasta una semana. */
export function proximoLibre(e: Estado, sucursal: SucursalId) {
  const hoy = hoyClave()
  for (let d = 0; d < 8; d++) {
    const dia = sumarDias(hoy, d)
    const h = huecos(e, sucursal, dia, 'corte')
    if (h.length) return { dia, ...h[0] }
  }
  return null
}
