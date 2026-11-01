import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Star } from 'lucide-react'
import { negocio, type SucursalId } from '../config/negocio'
import { aMin, ahoraMin, capital, duracion, fechaRelativa, hora, hoyClave, iniciales, pesos } from '../lib/formato'
import { franjas, proximoLibre, useDemo } from '../lib/store'
import { Logo, Techo, useRevelar } from '../lib/ui'
import { BarraDemo, Creditos } from './comun'

const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const f = negocio.fotos

/** Resume el horario semanal en filas como "Lunes a sábado · 10:00 a 20:30". */
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
  const hoy = hoyClave()
  const ahora = ahoraMin()
  const fr = franjas(id, hoy).map(([a, b]) => [aMin(a), aMin(b)])
  const abierta = fr.find(([a, b]) => ahora >= a && ahora < b)
  if (abierta) return { abierto: true, texto: `Abierto ahora, cierra a las ${hora(abierta[1])}` }
  const luego = fr.find(([a]) => a > ahora)
  if (luego) return { abierto: false, texto: `Cerrado, abre hoy a las ${hora(luego[0])}` }
  return { abierto: false, texto: 'Cerrado por hoy' }
}

function Estrellas({ n = 5, tamaño = 16 }: { n?: number; tamaño?: number }) {
  return (
    <span className="estrellas" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <Star key={i} size={tamaño} strokeWidth={0} fill="currentColor" />
      ))}
    </span>
  )
}

function Cabecera() {
  return (
    <header className="cabecera">
      <Link to="/" className="cabecera-marca" aria-label={`${negocio.nombre}, inicio`}>
        <Logo tamaño={34} />
        <span>
          Ayrton <em>Estilistas</em>
        </span>
      </Link>
      <nav className="cabecera-menu" aria-label="Secciones">
        <a href="#trabajos">Trabajos</a>
        <a href="#servicios">Precios</a>
        <a href="#resenas">Reseñas</a>
        <a href="#sucursales">Sucursales</a>
      </nav>
      <Link to="/reservar" className="btn btn-neon btn-chico">
        Sacar turno
      </Link>
    </header>
  )
}

function Portada() {
  const e = useDemo()
  const [suc, setSuc] = useState<SucursalId>('nuevo')
  const libre = useMemo(() => proximoLibre(e, suc), [e, suc])
  const barbero = libre && e.equipo.find((b) => b.id === libre.barberoId)
  const corte = e.servicios.find((s) => s.id === 'corte')!
  const destino = libre
    ? `/reservar?suc=${suc}&servicio=corte&dia=${libre.dia}&hora=${libre.inicio}&barbero=${libre.barberoId}`
    : `/reservar?suc=${suc}`

  return (
    <section className="portada">
      <div className="portada-texto">
        <Techo className="portada-techo" columnas={11} filas={2} />
        <a className="sello-google" href={negocio.google} target="_blank" rel="noreferrer">
          <Estrellas tamaño={14} />
          <strong>{negocio.calificacion.promedio.toLocaleString('es-AR')}</strong>
          <span>{negocio.calificacion.reseñas} reseñas en Google</span>
        </a>
        <h1>Tu corte, a la hora que elijas</h1>
        <p className="bajada">
          Barbería en Villa Carlos Paz, con dos sucursales en el centro. Niños y mayores. Elegí barbero y horario, y te
          esperamos con el sillón listo y un café.
        </p>

        <div className="libre" aria-live="polite">
          <div className="libre-cabeza">
            <span className="libre-titulo">
              <span className="punto-vivo" aria-hidden="true" /> Próximo turno libre
            </span>
            <div className="pestanas" role="tablist" aria-label="Sucursal">
              {negocio.sucursales.map((s) => (
                <button key={s.id} role="tab" aria-selected={suc === s.id} className={suc === s.id ? 'activa' : ''} onClick={() => setSuc(s.id)}>
                  {s.nombre}
                </button>
              ))}
            </div>
          </div>
          {libre && barbero ? (
            <div className="libre-cuerpo">
              <p className="libre-hora">
                <span>{capital(fechaRelativa(libre.dia))}</span>
                {hora(libre.inicio)}
              </p>
              <p className="libre-detalle">
                Con {barbero.nombre} · Corte {pesos(corte.precio)}
                <br />
                {negocio.sucursales.find((s) => s.id === suc)!.direccion}
              </p>
            </div>
          ) : (
            <p className="libre-detalle">Esta semana está completa. Escribinos por WhatsApp y te avisamos si se libera.</p>
          )}
          <div className="libre-acciones">
            <Link className="btn btn-neon" to={destino}>
              {libre ? `Reservar las ${hora(libre.inicio)}` : 'Ver horarios'}
            </Link>
            <Link className="enlace" to={`/reservar?suc=${suc}`}>
              Elegir otro horario
            </Link>
          </div>
        </div>
      </div>
      <figure className="portada-foto">
        <img src={f.salon.src} alt={f.salon.alt} width={f.salon.ancho} height={f.salon.alto} fetchPriority="high" />
        <figcaption>@{f.salon.autor}</figcaption>
      </figure>
    </section>
  )
}

const trabajos = [
  { foto: f.mullet, titulo: 'Mullet con mechas', clase: '' },
  { foto: f.mechas, titulo: 'Mechas en proceso', clase: '' },
  { foto: f.neon, titulo: 'Centro Viejo, Sarmiento 280', clase: 'trabajo-neon' },
]

function Trabajos() {
  const ref = useRevelar<HTMLElement>()
  return (
    <section id="trabajos" className="trabajos" ref={ref}>
      <div className="seccion-cabeza revela">
        <h2>Salido del sillón</h2>
        <a className="enlace-flecha" href={`https://instagram.com/${negocio.instagram}`} target="_blank" rel="noreferrer">
          Más en @{negocio.instagram} <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      </div>
      <ul className="trabajos-lista">
        {trabajos.map(({ foto, titulo, clase }) => (
          <li key={foto.src} className={`trabajo revela ${clase}`}>
            <img src={foto.src} alt={foto.alt} width={foto.ancho} height={foto.alto} loading="lazy" />
            <p>
              <strong>{titulo}</strong>
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

function Servicios() {
  const e = useDemo()
  const ref = useRevelar<HTMLElement>()
  const grupos = ['Corte', 'Barba', 'Color'] as const
  return (
    <section id="servicios" className="servicios" ref={ref}>
      <div className="servicios-intro revela">
        <h2>Servicios y precios</h2>
        <p>Precios de noviembre. Pagás en el local: efectivo, transferencia, débito o Mercado Pago.</p>
        <dl className="servicios-horario">
          {negocio.sucursales.map((s) => (
            <div key={s.id}>
              <dt>{s.nombre}</dt>
              {filasHorario(s.id).map((h) => (
                <dd key={h.dias}>
                  {h.dias} <span>{h.horas}</span>
                </dd>
              ))}
            </div>
          ))}
        </dl>
        <figure className="servicios-foto">
          <img src={f.diseno.src} alt={f.diseno.alt} width={f.diseno.ancho} height={f.diseno.alto} loading="lazy" />
          <figcaption>Fade con diseño · @{f.diseno.autor}</figcaption>
        </figure>
      </div>
      <div className="servicios-lista">
        {grupos.map((g) => (
          <div className="grupo revela" key={g}>
            <h3 className="oculto">{g}</h3>
            <ul>
              {e.servicios
                .filter((s) => s.grupo === g)
                .map((s) => (
                  <li key={s.id}>
                    <Link to={`/reservar?servicio=${s.id}`} className="servicio">
                      <span className="servicio-nombre">{s.nombre}</span>
                      <span className="servicio-precio">{pesos(s.precio)}</span>
                      <span className="servicio-desc">
                        {s.descripcion} <span className="tenue">{duracion(s.duracion)}</span>
                      </span>
                      <ArrowRight className="servicio-flecha" size={20} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

function Resenas() {
  const ref = useRevelar<HTMLElement>()
  const pista = useRef<HTMLUListElement>(null)
  const [actual, setActual] = useState(0)
  const [quieto, setQuieto] = useState(false)
  const total = negocio.reseñas.length

  const ir = (i: number) => {
    const el = pista.current
    if (!el) return
    const n = (i + total) % total
    const tarjeta = el.children[n] as HTMLElement
    el.scrollTo({ left: tarjeta.offsetLeft - el.offsetLeft, behavior: 'smooth' })
  }

  // Cuál tarjeta está a la vista, según el scroll
  useEffect(() => {
    const el = pista.current
    if (!el) return
    const medir = () => {
      const ancho = (el.children[0] as HTMLElement).offsetWidth
      setActual(Math.round(el.scrollLeft / (ancho + 16)))
    }
    el.addEventListener('scroll', medir, { passive: true })
    return () => el.removeEventListener('scroll', medir)
  }, [])

  // Avanza solo, salvo que el visitante esté mirando o haya pedido menos movimiento
  useEffect(() => {
    if (quieto || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => {
      if (!document.hidden) ir(actual + 1)
    }, 5500)
    return () => clearInterval(t)
  })

  return (
    <section id="resenas" className="resenas" ref={ref}>
      <div className="resenas-nota revela">
        <p className="resenas-numero">{negocio.calificacion.promedio.toLocaleString('es-AR')}</p>
        <Estrellas tamaño={22} />
        <p>
          Promedio de {negocio.calificacion.reseñas} reseñas en Google de clientes de Villa Carlos Paz.
        </p>
        <a className="enlace-flecha" href={negocio.google} target="_blank" rel="noreferrer">
          Leer todas en Google <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      </div>
      <div
        className="carrusel revela"
        onMouseEnter={() => setQuieto(true)}
        onMouseLeave={() => setQuieto(false)}
        onFocus={() => setQuieto(true)}
        onBlur={() => setQuieto(false)}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Reseñas de clientes"
      >
        <ul className="carrusel-pista" ref={pista}>
          {negocio.reseñas.map((r, i) => (
            <li key={i} className="resena" aria-roledescription="reseña" aria-label={`${i + 1} de ${total}`}>
              <Estrellas tamaño={15} />
              <blockquote>{r.texto}</blockquote>
              <p className="resena-autor">
                <span className="resena-inicial" aria-hidden="true">
                  {r.nombre.startsWith('Cliente') ? 'G' : iniciales(r.nombre)}
                </span>
                <span>
                  <strong>{r.nombre}</strong>
                  <small>Google · {r.cuando}</small>
                </span>
              </p>
            </li>
          ))}
        </ul>
        <div className="carrusel-controles">
          <div className="carrusel-puntos" aria-hidden="true">
            {negocio.reseñas.map((_, i) => (
              <span key={i} className={i === actual ? 'activo' : ''} />
            ))}
          </div>
          <button className="redondo" onClick={() => ir(actual - 1)} aria-label="Reseña anterior">
            <ArrowLeft size={20} />
          </button>
          <button className="redondo" onClick={() => ir(actual + 1)} aria-label="Reseña siguiente">
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </section>
  )
}

function Casa() {
  const ref = useRevelar<HTMLElement>()
  return (
    <section className="casa" ref={ref} aria-label="Más que un corte">
      <article className="casa-bloque revela">
        <img src={f.cafe.src} alt={f.cafe.alt} width={f.cafe.ancho} height={f.cafe.alto} loading="lazy" />
        <div>
          <h2>Café de la casa</h2>
          <p>
            Estrenamos sector de cafetería. Si llegás antes o venís a acompañar a alguien, te servimos un café mientras
            esperás.
          </p>
        </div>
      </article>
      <article className="casa-bloque casa-academia revela">
        <Techo className="casa-techo" columnas={7} filas={4} r={56} />
        <div>
          <h2>Ayrton Academy</h2>
          <p>
            Curso presencial de barbería 2026. Aprendé el oficio en el salón, con el equipo de Ayrton: cupos chicos y
            práctica con clientes reales en Villa Carlos Paz.
          </p>
          <a className="btn btn-claro" href={`https://wa.me/54${negocio.sucursales[0].telefono.replace(/\D/g, '')}?text=${encodeURIComponent('Hola! Quiero info del curso de barbería de Ayrton Academy')}`} target="_blank" rel="noreferrer">
            Pedir info por WhatsApp
          </a>
        </div>
      </article>
    </section>
  )
}

function Sucursales() {
  const e = useDemo()
  const ref = useRevelar<HTMLElement>()
  return (
    <section id="sucursales" className="sucursales" ref={ref}>
      <div className="seccion-cabeza revela">
        <h2>Dos sucursales en el centro</h2>
      </div>
      <div className="sucursales-grilla">
        {negocio.sucursales.map((s) => {
          const ahora = estadoAhora(s.id)
          const equipo = e.equipo.filter((b) => b.sucursal === s.id)
          return (
            <article key={s.id} className="sucursal revela">
              <p className={`sucursal-estado ${ahora.abierto ? 'abierto' : ''}`}>
                <span className="punto-vivo" aria-hidden="true" /> {ahora.texto}
              </p>
              <h3>{s.nombre}</h3>
              <p className="sucursal-direccion">{s.direccion}</p>
              <dl className="horario">
                {filasHorario(s.id).map((h) => (
                  <div key={h.dias}>
                    <dt>{h.dias}</dt>
                    <dd>{h.horas}</dd>
                  </div>
                ))}
              </dl>
              <div className="sucursal-equipo">
                <ul>
                  {equipo.map((b) => (
                    <li key={b.id} className="hex" style={{ ['--tono' as string]: b.tono }} title={b.nombre}>
                      {b.nombre[0]}
                    </li>
                  ))}
                </ul>
                <p>{equipo.map((b) => b.nombre).join(', ').replace(/, ([^,]*)$/, ' y $1')}</p>
              </div>
              <div className="sucursal-acciones">
                <Link className="btn btn-neon" to={`/reservar?suc=${s.id}`}>
                  Sacar turno acá
                </Link>
                <a className="btn btn-borde" href={`https://wa.me/54${s.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                  WhatsApp {s.telefono}
                </a>
                <a className="enlace" href={s.mapa} target="_blank" rel="noreferrer">
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
      <Techo className="pie-techo" columnas={13} filas={2} r={50} />
      <div className="pie-cuerpo">
        <p className="pie-marca" aria-hidden="true">
          Ayrton
        </p>
        <div className="pie-columnas">
          <div>
            <h2>Nos vemos en el sillón.</h2>
            <Link className="btn btn-neon" to="/reservar">
              Sacar turno
            </Link>
          </div>
          <ul>
            <li>
              <a href={`https://instagram.com/${negocio.instagram}`} target="_blank" rel="noreferrer">
                Instagram @{negocio.instagram}
              </a>
            </li>
            {negocio.sucursales.map((s) => (
              <li key={s.id}>
                <a href={s.mapa} target="_blank" rel="noreferrer">
                  {s.direccion} · {s.nombre}
                </a>
              </li>
            ))}
            <li>
              <Link to="/admin">Panel del negocio</Link>
            </li>
          </ul>
        </div>
        <p className="pie-legal">
          © {new Date().getFullYear()} {negocio.nombre} · {negocio.ciudad}, {negocio.provincia}
        </p>
        <Creditos />
      </div>
    </footer>
  )
}

export default function Sitio() {
  useEffect(() => {
    document.title = `${negocio.nombre} · ${negocio.rubro} en ${negocio.ciudad}`
  }, [])
  return (
    <div className="sitio">
      <BarraDemo />
      <Cabecera />
      <main>
        <Portada />
        <Trabajos />
        <Servicios />
        <Resenas />
        <Casa />
        <Sucursales />
      </main>
      <Pie />
    </div>
  )
}
