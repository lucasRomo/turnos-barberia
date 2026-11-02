import { useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, MapPin, Star } from 'lucide-react'
import { negocio, type SucursalId } from '../config/negocio'
import { aMin, ahoraMin, capital, duracion, fechaRelativa, hora, hoyClave, pesos } from '../lib/formato'
import { franjas, proximoLibre, useDemo } from '../lib/store'
import { Logo } from '../lib/ui'
import { BarraDemo, Creditos } from './comun'

const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const f = negocio.fotos
const whatsapp = (tel: string, texto?: string) =>
  `https://wa.me/54${tel.replace(/\D/g, '')}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`

/** Resume el horario semanal en filas como "Lunes a sábado: 10:00 a 20:30". */
function filasHorario(id: SucursalId) {
  const s = negocio.sucursales.find((x) => x.id === id)!
  const texto = (d: number) => s.horario[d]?.map(([a, b]) => `${a} a ${b}`).join(' y ') ?? 'Cerrado'
  const filas: { dias: string; horas: string }[] = []
  let inicio = 1
  for (let d = 1; d <= 7; d++) {
    const actual = texto(d % 7)
    const siguiente = d < 7 ? texto((d + 1) % 7) : null
    if (actual !== siguiente) {
      const desde = dias[inicio % 7]
      const hasta = dias[d % 7].toLowerCase()
      filas.push({ dias: inicio === d ? desde : `${desde} a ${hasta}`, horas: actual })
      inicio = d + 1
    }
  }
  return filas
}

/** "Abierto, cierra a las 20:30" o "Cerrado, abre a las 16:30" para hoy. */
function estadoAhora(id: SucursalId) {
  const ahora = ahoraMin()
  const fr = franjas(id, hoyClave()).map(([a, b]) => [aMin(a), aMin(b)])
  const abierta = fr.find(([a, b]) => ahora >= a && ahora < b)
  if (abierta) return { abierto: true, texto: `Abierto, cierra a las ${hora(abierta[1])}` }
  const luego = fr.find(([a]) => a > ahora)
  if (luego) return { abierto: false, texto: `Cerrado, abre a las ${hora(luego[0])}` }
  return { abierto: false, texto: 'Cerrado por hoy' }
}

function Estrellas({ tamaño = 16 }: { tamaño?: number }) {
  return (
    <span className="estrellas" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={tamaño} strokeWidth={0} fill="currentColor" />
      ))}
    </span>
  )
}

function Cabecera() {
  return (
    <header className="cabecera">
      <Link to="/" className="marca" aria-label={`${negocio.nombre}, inicio`}>
        <Logo tamaño={32} />
        <span>{negocio.nombre}</span>
      </Link>
      <Link to="/reservar" className="btn btn-primario btn-chico en-escritorio">
        Sacar turno
      </Link>
    </header>
  )
}

function Galeria() {
  return (
    <div className="galeria">
      <img className="galeria-grande" src={f.salon.src} alt={f.salon.alt} width={f.salon.ancho} height={f.salon.alto} fetchPriority="high" />
      <img src={f.neon.src} alt={f.neon.alt} width={f.neon.ancho} height={f.neon.alto} />
      <img src={f.mullet.src} alt={f.mullet.alt} width={f.mullet.ancho} height={f.mullet.alto} />
      <a className="galeria-mas" href="#trabajos">
        Ver trabajos
      </a>
    </div>
  )
}

function Ficha() {
  const ahora = estadoAhora('nuevo')
  return (
    <section className="perfil">
      <h1>{negocio.nombre}</h1>
      <p className="ficha-rubro">Barbería en {negocio.ciudad}. Niños y mayores.</p>
      <ul className="ficha-datos">
        <li>
          <a href="#resenas" className="ficha-nota">
            <Star size={16} strokeWidth={0} fill="currentColor" aria-hidden="true" />
            <strong>{negocio.calificacion.promedio.toLocaleString('es-AR')}</strong>
            <span>({negocio.calificacion.reseñas} reseñas en Google)</span>
          </a>
        </li>
        <li>
          <MapPin size={16} aria-hidden="true" />
          <a href="#sucursales">2 sucursales en el centro</a>
        </li>
        <li className={ahora.abierto ? 'ficha-abierto' : ''}>
          <Clock size={16} aria-hidden="true" />
          Centro Nuevo: {ahora.texto.toLowerCase()}
        </li>
      </ul>
    </section>
  )
}

/** El turno más cercano que está libre, por sucursal. Es lo primero que se puede reservar. */
function ProximoLibre() {
  const e = useDemo()
  const id = useId()
  const [suc, setSuc] = useState<SucursalId>('nuevo')
  const libre = useMemo(() => proximoLibre(e, suc), [e, suc])
  const barbero = libre && e.equipo.find((b) => b.id === libre.barberoId)
  const corte = e.servicios.find((s) => s.id === 'corte')!
  const destino = libre
    ? `/reservar?suc=${suc}&servicio=corte&dia=${libre.dia}&hora=${libre.inicio}&barbero=${libre.barberoId}`
    : `/reservar?suc=${suc}`

  return (
    <aside className="libre" aria-labelledby={id} aria-live="polite">
      <h2 id={id}>Próximo turno libre</h2>
      <div className="segmento" role="tablist" aria-label="Sucursal">
        {negocio.sucursales.map((s) => (
          <button key={s.id} role="tab" aria-selected={suc === s.id} className={suc === s.id ? 'activo' : ''} onClick={() => setSuc(s.id)}>
            {s.nombre}
          </button>
        ))}
      </div>
      {libre && barbero ? (
        <p className="libre-hora">
          {capital(fechaRelativa(libre.dia))} a las <strong>{hora(libre.inicio)}</strong>
          <span>
            Corte con {barbero.nombre}, {pesos(corte.precio)}
          </span>
        </p>
      ) : (
        <p className="libre-hora">
          <span>Esta semana está completa. Escribinos y te avisamos si se libera un lugar.</span>
        </p>
      )}
      <Link className="btn btn-primario btn-ancho" to={destino}>
        {libre ? `Reservar ${fechaRelativa(libre.dia)} ${hora(libre.inicio)}` : 'Ver horarios'}
      </Link>
      <Link className="btn btn-secundario btn-ancho" to={`/reservar?suc=${suc}`}>
        Elegir otro día u horario
      </Link>
      <p className="libre-nota">Sin registrarte y sin pagar por adelantado.</p>
    </aside>
  )
}

const secciones = [
  ['servicios', 'Servicios'],
  ['trabajos', 'Trabajos'],
  ['equipo', 'Equipo'],
  ['resenas', 'Reseñas'],
  ['sucursales', 'Sucursales'],
]

function Indice() {
  return (
    <nav className="indice" aria-label="Secciones">
      {secciones.map(([id, t]) => (
        <a key={id} href={`#${id}`}>
          {t}
        </a>
      ))}
    </nav>
  )
}

function Servicios() {
  const e = useDemo()
  const grupos = [
    ['Corte', 'Cortes'],
    ['Barba', 'Barba'],
    ['Color', 'Color y mechas'],
  ] as const
  return (
    <section id="servicios" className="bloque">
      <h2>Servicios</h2>
      <p className="bloque-bajada">Precios de noviembre. Se paga en el local con efectivo, transferencia, débito o Mercado Pago.</p>
      {grupos.map(([g, titulo]) => (
        <div className="grupo" key={g}>
          <h3>{titulo}</h3>
          <ul className="servicios">
            {e.servicios
              .filter((s) => s.grupo === g)
              .map((s) => (
                <li key={s.id} className="servicio">
                  <div>
                    <p className="servicio-nombre">{s.nombre}</p>
                    <p className="servicio-desc">{s.descripcion}</p>
                    <p className="servicio-tiempo">{duracion(s.duracion)}</p>
                  </div>
                  <div className="servicio-derecha">
                    <p className="servicio-precio">{pesos(s.precio)}</p>
                    <Link to={`/reservar?servicio=${s.id}`} className="btn btn-secundario btn-chico" aria-label={`Reservar ${s.nombre}`}>
                      Reservar
                    </Link>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

const trabajos = [f.mullet, f.mechas, f.diseno, f.salon, f.neon, f.cafe]
const titulos: Record<string, string> = {
  [f.mullet.src]: 'Mullet con mechas',
  [f.mechas.src]: 'Mechas en proceso',
  [f.diseno.src]: 'Fade con diseño',
  [f.salon.src]: 'Centro Nuevo',
  [f.neon.src]: 'Centro Viejo',
  [f.cafe.src]: 'El café de la casa',
}

function Trabajos() {
  return (
    <section id="trabajos" className="bloque">
      <h2>Trabajos</h2>
      <p className="bloque-bajada">
        De su Instagram,{' '}
        <a href={`https://instagram.com/${negocio.instagram}`} target="_blank" rel="noreferrer">
          @{negocio.instagram}
        </a>
        .
      </p>
      <ul className="trabajos">
        {trabajos.map((foto) => (
          <li key={foto.src}>
            <img src={foto.src} alt={foto.alt} width={foto.ancho} height={foto.alto} loading="lazy" />
            <p>
              {titulos[foto.src]}
              <a href={`https://instagram.com/${foto.autor}`} target="_blank" rel="noreferrer">
                @{foto.autor}
              </a>
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Equipo() {
  const e = useDemo()
  return (
    <section id="equipo" className="bloque">
      <h2>Equipo</h2>
      <p className="bloque-bajada">Elegí con quién cortarte o reservá con el primero que esté libre.</p>
      <ul className="equipo">
        {e.equipo.map((b) => (
          <li key={b.id}>
            <Link to={`/reservar?suc=${b.sucursal}&barbero=${b.id}`} className="barbero">
              <span className="avatar" style={{ ['--tono' as string]: b.tono }} aria-hidden="true">
                {b.nombre[0]}
              </span>
              <span className="barbero-nombre">{b.nombre}</span>
              <span className="barbero-dato">{negocio.sucursales.find((s) => s.id === b.sucursal)!.nombre}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Resenas() {
  const [todas, setTodas] = useState(false)
  const lista = todas ? negocio.reseñas : negocio.reseñas.slice(0, 4)
  return (
    <section id="resenas" className="bloque">
      <h2>Reseñas</h2>
      <div className="resumen-nota">
        <p className="resumen-numero">{negocio.calificacion.promedio.toLocaleString('es-AR')}</p>
        <div>
          <Estrellas tamaño={18} />
          <p>
            {negocio.calificacion.reseñas} reseñas en{' '}
            <a href={negocio.google} target="_blank" rel="noreferrer">
              Google
            </a>
          </p>
        </div>
      </div>
      <ul className="resenas">
        {lista.map((r, i) => (
          <li key={i} className="resena">
            <p className="resena-cabeza">
              <strong>{r.nombre}</strong>
              <span>{r.cuando}</span>
            </p>
            <Estrellas tamaño={13} />
            <blockquote>{r.texto}</blockquote>
          </li>
        ))}
      </ul>
      {!todas && (
        <button className="btn btn-secundario" onClick={() => setTodas(true)}>
          Ver {negocio.reseñas.length - 4} reseñas más
        </button>
      )}
    </section>
  )
}

function EnElLocal() {
  return (
    <section className="bloque" aria-labelledby="local-titulo">
      <h2 id="local-titulo">En el local</h2>
      <div className="local">
        <article className="local-item">
          <img src={f.cafe.src} alt={f.cafe.alt} width={f.cafe.ancho} height={f.cafe.alto} loading="lazy" />
          <div>
            <h3>Café mientras esperás</h3>
            <p>Si llegás antes o venís a acompañar a alguien, en Centro Nuevo te servimos un café.</p>
          </div>
        </article>
        <article className="local-item local-academia" style={{ backgroundImage: `url(${f.neon.src})` }}>
          <div>
            <h3>Ayrton Academy</h3>
            <p>Curso presencial de barbería 2026, en el salón y con clientes reales. Cupos chicos.</p>
            <a
              className="btn btn-secundario btn-chico"
              href={whatsapp(negocio.sucursales[0].telefono, 'Hola! Quiero info del curso de barbería de Ayrton Academy')}
              target="_blank"
              rel="noreferrer"
            >
              Pedir info por WhatsApp
            </a>
          </div>
        </article>
      </div>
    </section>
  )
}

function Sucursales() {
  const e = useDemo()
  return (
    <section id="sucursales" className="bloque">
      <h2>Sucursales</h2>
      <div className="sucursales">
        {negocio.sucursales.map((s) => {
          const ahora = estadoAhora(s.id)
          const equipo = e.equipo.filter((b) => b.sucursal === s.id)
          return (
            <article key={s.id} className="sucursal">
              <h3>{s.nombre}</h3>
              <p className="sucursal-direccion">
                {s.direccion}, {s.ciudad}
              </p>
              <p className={`abre ${ahora.abierto ? 'estado-abierto' : ''}`}>{ahora.texto}</p>
              <table className="horario">
                <tbody>
                  {filasHorario(s.id).map((h) => (
                    <tr key={h.dias}>
                      <th scope="row">{h.dias}</th>
                      <td>{h.horas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="sucursal-equipo">Atienden {equipo.map((b) => b.nombre).join(', ').replace(/, ([^,]*)$/, ' y $1')}.</p>
              <div className="sucursal-acciones">
                <Link className="btn btn-primario" to={`/reservar?suc=${s.id}`}>
                  Sacar turno en {s.nombre}
                </Link>
                <a className="btn btn-secundario" href={whatsapp(s.telefono)} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
                <a className="btn btn-secundario" href={s.mapa} target="_blank" rel="noreferrer">
                  Cómo llegar
                </a>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Pie() {
  return (
    <footer className="pie">
      <div className="pie-cuerpo">
        <Link to="/" className="marca">
          <Logo tamaño={28} />
          <span>{negocio.nombre}</span>
        </Link>
        <ul>
          <li>
            <a href={`https://instagram.com/${negocio.instagram}`} target="_blank" rel="noreferrer">
              Instagram
            </a>
          </li>
          {negocio.sucursales.map((s) => (
            <li key={s.id}>
              <a href={s.mapa} target="_blank" rel="noreferrer">
                {s.nombre}, {s.direccion}
              </a>
            </li>
          ))}
          <li>
            <Link to="/admin">Panel del negocio</Link>
          </li>
        </ul>
        <Creditos />
      </div>
    </footer>
  )
}

/** En el celular, la acción principal queda siempre a mano abajo. */
function BarraTurno() {
  const desde = Math.min(...negocio.servicios.map((s) => s.precio))
  return (
    <div className="barra-turno">
      <p>
        Desde <strong>{pesos(desde)}</strong>
      </p>
      <Link to="/reservar" className="btn btn-primario">
        Sacar turno
      </Link>
    </div>
  )
}

export default function Sitio() {
  useEffect(() => {
    document.title = `${negocio.nombre}, ${negocio.rubro.toLowerCase()} en ${negocio.ciudad}`
  }, [])
  return (
    <div className="sitio">
      <BarraDemo />
      <Cabecera />
      <Galeria />
      <div className="pagina">
        <main className="principal">
          <Ficha />
          <div className="en-movil">
            <ProximoLibre />
          </div>
          <Indice />
          <Servicios />
          <Trabajos />
          <Equipo />
          <Resenas />
          <EnElLocal />
          <Sucursales />
        </main>
        <div className="costado en-escritorio">
          <ProximoLibre />
        </div>
      </div>
      <Pie />
      <BarraTurno />
    </div>
  )
}
