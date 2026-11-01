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
      <Link to={a}>{texto} →</Link>
    </div>
  )
}

const fotos = [
  ['Barber shop, Quebec city, Canada', 'Wilfredor', 'CC0', 'https://commons.wikimedia.org/wiki/File:Barber_shop,_Quebec_city,_Canada.jpg'],
  ['Barbershop early 20th century (Amsterdam)', 'Mork', 'dominio público', 'https://commons.wikimedia.org/wiki/File:Barbershop_early_20th_century_(Amsterdam).jpg'],
  ['Bluegrass Heritage Museum, barbershop exhibit', 'Nheyob', 'CC0', 'https://commons.wikimedia.org/wiki/File:Bluegrass_Heritage_Museum_(Winchester,_Kentucky)_-_barbershop_exhibit.jpg'],
  ['Razor, cut-throat and pouch', 'Auckland War Memorial Museum', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Razor,_cut-throat_and_pouch_(AM_613072).jpg'],
  ["Kochs' Gold Medal Hydraulic Barbers' Chair No. 23", 'Theo. A. Kochs Co.', 'dominio público', 'https://commons.wikimedia.org/wiki/File:Kochs%27_Gold_Medal_Hydraulic_Barbers%27_Chair_No._23.jpg'],
  ['Lago San Roque - Córdoba', 'LuigiStudio', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Lago_San_Roque_-_C%C3%B3rdoba.jpg'],
  ['Reloj Cucú', 'Reina Himelfarb', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Reloj_Cuc%C3%BA.jpg'],
]

export function Creditos() {
  return (
    <p className="creditos">
      Fotos:{' '}
      {fotos.map(([t, a, l, u], i) => (
        <span key={u}>
          <a href={u} target="_blank" rel="noreferrer">
            “{t}”
          </a>{' '}
          de {a}, {l}
          {i < fotos.length - 1 ? '; ' : '.'}
        </span>
      ))}
    </p>
  )
}
