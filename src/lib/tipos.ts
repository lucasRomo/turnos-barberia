import type { Barbero, Producto, Servicio, SucursalId } from '../config/negocio'

export type EstadoTurno = 'reservado' | 'atendido' | 'ausente' | 'cancelado'
export type MetodoPago = 'efectivo' | 'transferencia' | 'mercadopago' | 'debito'
export type Origen = 'web' | 'whatsapp' | 'mostrador'

export type Cliente = {
  id: string
  nombre: string
  telefono: string
  nota?: string
  alta: string // YYYY-MM-DD
}

export type Turno = {
  id: string
  numero: number
  clienteId: string
  barberoId: string
  servicioId: string
  sucursal: SucursalId
  dia: string // YYYY-MM-DD
  inicio: number // minutos desde medianoche
  duracion: number
  precio: number
  estado: EstadoTurno
  origen: Origen
  pago?: MetodoPago
  nota?: string
}

export type Movimiento = {
  id: string
  dia: string
  hora: number
  sucursal: SucursalId
  tipo: 'producto' | 'egreso'
  concepto: string
  monto: number
  metodo: MetodoPago
}

export type EnEspera = {
  id: string
  nombre: string
  servicioId: string
  sucursal: SucursalId
  llegada: number
}

export type Estado = {
  version: number
  generado: string
  clientes: Cliente[]
  turnos: Turno[]
  movimientos: Movimiento[]
  espera: EnEspera[]
  servicios: Servicio[]
  equipo: Barbero[]
  productos: Producto[]
  cajaCerrada: string[] // claves "dia|sucursal"
  ultimoNumero: number
}

export const metodos: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mercadopago: 'Mercado Pago',
  debito: 'Débito',
}

export const origenes: Record<Origen, string> = {
  web: 'Web',
  whatsapp: 'WhatsApp',
  mostrador: 'Mostrador',
}

export const estados: Record<EstadoTurno, string> = {
  reservado: 'Reservado',
  atendido: 'Atendido',
  ausente: 'No vino',
  cancelado: 'Cancelado',
}
