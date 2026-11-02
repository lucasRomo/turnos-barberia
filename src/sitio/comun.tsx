import { Link } from 'react-router-dom'
import { negocio } from '../config/negocio'

export const PRODUCTO = 'Sillón'

/** Franja de la demo: explica qué es y lleva al panel. No es parte del diseño del cliente. */
export function BarraDemo({ a = '/admin', texto = 'Ver el panel del negocio' }: { a?: string; texto?: string }) {
  return (
    <div className="barra-demo">
      <p>
        Demo de {PRODUCTO} para {negocio.nombre}. Las reservas son de prueba.
      </p>
      <Link to={a}>{texto}</Link>
    </div>
  )
}

export function Creditos() {
  const autores = [...new Set(Object.values(negocio.fotos).map((f) => f.autor))]
  return (
    <p className="creditos">
      Fotos de Instagram:{' '}
      {autores.map((a, i) => (
        <span key={a}>
          <a href={`https://instagram.com/${a}`} target="_blank" rel="noreferrer">
            @{a}
          </a>
          {i < autores.length - 1 ? ', ' : '.'}
        </span>
      ))}{' '}
      Reseñas de Google.
    </p>
  )
}
