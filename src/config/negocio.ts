// Todos los datos de la peluquería viven acá.
// Para armar la demo de otro negocio, se cambia este archivo y nada más.
// Lo marcado como "muestra" es contenido de ejemplo: confirmarlo con el cliente.

export type SucursalId = 'nuevo' | 'viejo'

/** Franjas horarias por día de la semana (0 = domingo). */
export type Horario = Record<number, [string, string][]>

export type Sucursal = {
  id: SucursalId
  nombre: string
  direccion: string
  ciudad: string
  telefono: string
  mapa: string
  horario: Horario
}

export type Servicio = {
  id: string
  nombre: string
  descripcion: string
  grupo: 'Corte' | 'Barba' | 'Color'
  precio: number
  duracion: number // minutos
  online: boolean
  muestra?: boolean
}

export type Barbero = {
  id: string
  nombre: string
  sucursal: SucursalId
  /** Tono propio (0-360) para identificarlo en agenda y reportes. */
  tono: number
  comision: number // porcentaje
  desde: string
  /** Día de franco (0 = domingo), si tiene. */
  franco?: number
}

export type Producto = {
  id: string
  nombre: string
  precio: number
  stock: number
  muestra?: boolean
}

const lunesASabado = (franjas: [string, string][]): Horario => ({
  1: franjas, 2: franjas, 3: franjas, 4: franjas, 5: franjas, 6: franjas,
})

export const negocio = {
  nombre: 'Ayrton Estilistas',
  nombreCorto: 'Ayrton',
  rubro: 'Barbería',
  ciudad: 'Villa Carlos Paz',
  provincia: 'Córdoba',
  instagram: 'ayrton.estilistas',
  dueño: 'Ayrton',
  bajada: 'Tu espacio favorito para cortarte el pelo. Niños y mayores.',
  academia: 'Ayrton Academy: curso presencial de barbería 2026',
  calificacion: { promedio: 5.0, reseñas: 38 },

  sucursales: [
    {
      id: 'nuevo',
      nombre: 'Centro Nuevo',
      direccion: 'José Ingenieros 90',
      ciudad: 'Villa Carlos Paz',
      telefono: '3541 20-3430',
      mapa: 'https://maps.google.com/?q=José+Ingenieros+90,+Villa+Carlos+Paz',
      horario: { ...lunesASabado([['10:00', '20:30']]), 0: [['17:00', '20:30']] },
    },
    {
      id: 'viejo',
      nombre: 'Centro Viejo',
      direccion: 'Bv. Sarmiento 280',
      ciudad: 'Villa Carlos Paz',
      telefono: '3541 56-8019',
      mapa: 'https://maps.google.com/?q=Boulevard+Sarmiento+280,+Villa+Carlos+Paz',
      horario: lunesASabado([['10:00', '13:00'], ['16:30', '20:30']]),
    },
  ] as Sucursal[],

  servicios: [
    { id: 'corte', nombre: 'Corte', descripcion: 'Tijera o máquina, con lavado y peinado.', grupo: 'Corte', precio: 18000, duracion: 30, online: true },
    { id: 'corte-nino', nombre: 'Corte niños', descripcion: 'Hasta 12 años.', grupo: 'Corte', precio: 15000, duracion: 30, online: true, muestra: true },
    { id: 'corte-barba', nombre: 'Corte y barba', descripcion: 'Corte completo y barba con toalla caliente.', grupo: 'Barba', precio: 25000, duracion: 45, online: true },
    { id: 'barba', nombre: 'Barba', descripcion: 'Perfilado a navaja y toalla caliente.', grupo: 'Barba', precio: 10000, duracion: 20, online: true, muestra: true },
    { id: 'color', nombre: 'Color global', descripcion: 'Incluye corte. Se reserva la tarde.', grupo: 'Color', precio: 90000, duracion: 240, online: true },
    { id: 'mechas', nombre: 'Mechas platinadas', descripcion: 'Incluye corte. Decoloración y matiz.', grupo: 'Color', precio: 90000, duracion: 300, online: true },
  ] as Servicio[],

  // Equipo según su página de turnos; tonos y comisiones son de muestra.
  equipo: [
    { id: 'agus', nombre: 'Agus', sucursal: 'nuevo', tono: 28, comision: 50, desde: '2022', franco: 1 },
    { id: 'benja', nombre: 'Benja', sucursal: 'nuevo', tono: 150, comision: 45, desde: '2024', franco: 2 },
    { id: 'blas', nombre: 'Blas', sucursal: 'nuevo', tono: 210, comision: 50, desde: '2021', franco: 3 },
    { id: 'lucas', nombre: 'Lucas', sucursal: 'nuevo', tono: 300, comision: 45, desde: '2023', franco: 4 },
    { id: 'fede', nombre: 'Fede', sucursal: 'viejo', tono: 90, comision: 50, desde: '2022' },
  ] as Barbero[],

  productos: [
    { id: 'pomada', nombre: 'Pomada mate', precio: 12000, stock: 14, muestra: true },
    { id: 'cera', nombre: 'Cera de brillo', precio: 11000, stock: 9, muestra: true },
    { id: 'aceite', nombre: 'Aceite para barba', precio: 9500, stock: 3, muestra: true },
    { id: 'shampoo', nombre: 'Shampoo matizador', precio: 14000, stock: 6, muestra: true },
  ] as Producto[],
}

export type Negocio = typeof negocio
