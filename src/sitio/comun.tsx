import { Link } from 'react-router-dom'
import { negocio } from '../config/negocio'

export const PRODUCTO = 'Sillón'

/** Franja de la demo: explica qué es y lleva al panel. No es parte del diseño del cliente. */
export function BarraDemo({ a = '/admin', texto = 'Ver el panel del negocio' }: { a?: string; texto?: string }) {
  return (
    <div className="barra-demo">
      <p>
        {negocio.inventado
          ? `Demo de ${PRODUCTO} para barberías. ${negocio.nombre} es inventada y las reservas son de prueba.`
          : `Demo de ${PRODUCTO} para ${negocio.nombre}. Las reservas son de prueba.`}
      </p>
      <Link to={a}>{texto}</Link>
    </div>
  )
}

export function Creditos() {
  const { texto, enlaces } = negocio.creditos
  return (
    <p className="creditos">
      {texto}:{' '}
      {enlaces.map((a, i) => (
        <span key={a.url}>
          <a href={a.url} target="_blank" rel="noreferrer">
            {a.texto}
          </a>
          {i < enlaces.length - 1 ? ', ' : '.'}
        </span>
      ))}{' '}
      {negocio.inventado ? 'Nombres, datos y reseñas de ejemplo.' : 'Reseñas de Google.'}
    </p>
  )
}
