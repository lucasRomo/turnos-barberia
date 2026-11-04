// La forma de los datos de un negocio. Cada demo es un archivo con estos datos (ayrton.ts, filo.ts).

export type SucursalId = string

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
  instagram?: string
}

export type Producto = {
  id: string
  nombre: string
  precio: number
  stock: number
  muestra?: boolean
}

export type Foto = { src: string; ancho: number; alto: number; alt: string; titulo?: string; autor: string }

export type Negocio = {
  /** Identifica la demo: separa los datos guardados en el navegador y elige logo. */
  id: string
  nombre: string
  nombreCorto: string
  rubro: string
  ciudad: string
  provincia: string
  instagram: string
  dueño: string
  /** Si el negocio es inventado para mostrar el sistema a otros. */
  inventado: boolean
  /** La frase de la portada. */
  bajada: string
  colores: {
    acento: string
    hover: string
    /** Fondo claro del acento, para chips y hover. */
    claro: string
    /** Texto claro sobre el acento o sobre negro. */
    tenue: string
    /** El acento oscuro, para texto sobre el fondo claro. */
    tinta: string
  }
  calificacion: { promedio: number; reseñas: number }
  google?: string
  reseñas: { nombre: string; cuando: string; texto: string }[]
  fotos: { portada: Foto[]; trabajos: Foto[] }
  /** Bloques con foto grande de "En el local". */
  local: { titulo: string; texto: string; foto: Foto; whatsapp?: string; boton?: string; acento?: boolean }[]
  creditos: { texto: string; enlaces: { texto: string; url: string }[] }
  sucursales: Sucursal[]
  servicios: Servicio[]
  equipo: Barbero[]
  productos: Producto[]
}

export const lunesASabado = (franjas: [string, string][]): Horario => ({
  1: franjas, 2: franjas, 3: franjas, 4: franjas, 5: franjas, 6: franjas,
})
