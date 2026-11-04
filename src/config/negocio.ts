// El negocio de esta demo. Hay dos y se elige al compilar:
// - filo.ts: una barbería inventada, para mostrarle el sistema a cualquier barbería (la de siempre).
// - ayrton.ts: Ayrton Estilistas con sus datos reales (npm run build -- --mode ayrton).
// Para la demo de otro local se copia filo.ts, se cambian los datos y se suma acá.
import { ayrton } from './ayrton'
import { filo } from './filo'
import type { Negocio } from './tipos'

export type { Barbero, Foto, Horario, Negocio, Producto, Servicio, Sucursal, SucursalId } from './tipos'

const negocios: Record<string, Negocio> = { filo, ayrton }

export const negocio: Negocio = negocios[import.meta.env.VITE_NEGOCIO ?? 'filo'] ?? filo
