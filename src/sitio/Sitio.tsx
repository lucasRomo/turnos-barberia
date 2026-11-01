import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { negocio, type SucursalId } from '../config/negocio'
import { capital, duracion, fechaRelativa, hora, pesos } from '../lib/formato'
import { proximoLibre, useDemo } from '../lib/store'
import { Franja, useRevelar } from '../lib/ui'
import { BarraDemo, Creditos } from './comun'

const fotosSalon = [
  { src: 'img/salon.jpg', alt: 'Dos sillones de barbero frente a los espejos de un salón vacío' },
  { src: 'img/salon-antiguo.jpg', alt: 'Sillón de barbero de cuero rojo y vitrinas de madera con productos' },
  { src: 'img/salon-museo.jpg', alt: 'Interior de una barbería antigua con sillón y espejo' },
]

const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

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

function Portada() {
  const e = useDemo()
  const [suc, setSuc] = useState<SucursalId>('nuevo')
  const [foto, setFoto] = useState(0)
  const libre = useMemo(() => proximoLibre(e, suc), [e, suc])
  const barbero = libre && e.equipo.find((b) => b.id === libre.barberoId)
  const corte = e.servicios.find((s) => s.id === 'corte')!

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => {
      if (!document.hidden) setFoto((f) => (f + 1) % fotosSalon.length)
    }, 6000)
    return () => clearInterval(t)
  }, [])

  const destino = libre
    ? `/reservar?suc=${suc}&servicio=corte&dia=${libre.dia}&hora=${libre.inicio}&barbero=${libre.barberoId}`
    : `/reservar?suc=${suc}`

  return (
    <header className="portada">
      <div className="portada-foto">
        {fotosSalon.map((f, i) => (
          <img key={f.src} src={f.src} alt={i === 0 ? f.alt : ''} className={i === foto ? 'activa' : ''} width={1400} height={1800} />
        ))}
      </div>
      <div className="portada-ticket ticket">
        <Franja />
        <div className="ticket-cuerpo">
          <p className="marca">
            <span className="marca-nombre">{negocio.nombreCorto}</span>
            <span className="marca-sub">Estilistas · {negocio.ciudad}</span>
          </p>
          <h1>Tu corte, a la hora que elijas</h1>
          <p className="bajada">
            Somos la barbería de Centro Nuevo y Centro Viejo, en Villa Carlos Paz. Niños y mayores. Elegí barbero y horario
            y llegás sin esperar.
          </p>
        </div>

        <div className="ticket-talon" aria-live="polite">
          <div className="talon-cabeza">
            <h2 className="talon-titulo">Próximo turno libre</h2>
            <div className="pestanas" role="tablist" aria-label="Sucursal">
              {negocio.sucursales.map((s) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={suc === s.id}
                  className={suc === s.id ? 'activa' : ''}
                  onClick={() => setSuc(s.id)}
                >
                  {s.nombre}
                </button>
              ))}
            </div>
          </div>
          {libre && barbero ? (
            <>
              <p className="talon-hora">
                <span>{capital(fechaRelativa(libre.dia))}</span> {hora(libre.inicio)}
              </p>
              <p className="talon-detalle">
                Con {barbero.nombre} · Corte {pesos(corte.precio)} · {negocio.sucursales.find((s) => s.id === suc)!.direccion}
              </p>
            </>
          ) : (
            <p className="talon-detalle">Esta semana está completa. Escribinos por WhatsApp y te avisamos si se libera.</p>
          )}
          <div className="talon-acciones">
            <Link className="btn btn-acento" to={destino}>
              {libre ? `Reservar las ${hora(libre.inicio)}` : 'Ver horarios'}
            </Link>
            <Link className="enlace" to={`/reservar?suc=${suc}`}>
              Elegir otro horario
            </Link>
          </div>
        </div>
        <nav className="ticket-pie" aria-label="Secciones">
          <a href="#servicios">Servicios y precios</a>
          <a href="#sucursales">Sucursales</a>
          <a href={`https://instagram.com/${negocio.instagram}`} target="_blank" rel="noreferrer">
            Instagram
          </a>
        </nav>
      </div>
    </header>
  )
}

function Servicios() {
  const e = useDemo()
  const ref = useRevelar<HTMLElement>()
  const grupos = ['Corte', 'Barba', 'Color'] as const
  return (
    <section id="servicios" className="servicios" ref={ref}>
      <img className="servicios-fondo" src="img/navaja.jpg" alt="" width={1400} height={597} loading="lazy" />
      <div className="hoja revela">
        <h2>Servicios y precios</h2>
        <p className="hoja-nota">Precios de noviembre. Se paga en efectivo, transferencia, débito o Mercado Pago.</p>
        {grupos.map((g) => (
          <div className="hoja-grupo" key={g}>
            <h3>{g}</h3>
            <ul>
              {e.servicios
                .filter((s) => s.grupo === g)
                .map((s) => (
                  <li key={s.id}>
                    <Link to={`/reservar?servicio=${s.id}`} className="hoja-item">
                      <span className="hoja-nombre">{s.nombre}</span>
                      <span className="hoja-precio">{pesos(s.precio)}</span>
                      <span className="hoja-desc">
                        {s.descripcion} {duracion(s.duracion)}.
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
        <div className="hoja-horario">
          {negocio.sucursales.map((s) => (
            <p key={s.id}>
              <strong>{s.nombre}</strong> {filasHorario(s.id).map((f) => `${f.dias} ${f.horas}`).join(' · ')}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

function Carta() {
  const ref = useRevelar<HTMLElement>()
  return (
    <section className="carta-seccion" ref={ref} aria-labelledby="carta-titulo">
      <article className="carta revela">
        <div className="carta-retrato" aria-hidden="true">
          A
        </div>
        <h2 id="carta-titulo">Por qué abrimos con turno</h2>
        <p>
          Empecé cortando en casa a mis amigos del barrio. Hoy somos seis en dos sucursales y la regla sigue siendo la misma:
          que salgas mejor de lo que entraste.
        </p>
        <p>
          En temporada Carlos Paz se llena y nadie quiere pasar la tarde en una silla de espera. Por eso pusimos los turnos
          online: elegís con quién, a qué hora, y te esperamos con el sillón listo y un café.
        </p>
        <p>
          Si preferís venir sin turno, también podés. Te anotamos por <mark>orden de llegada</mark> y te decimos cuánto falta.
        </p>
        <p>Y si te gusta el oficio, este año abrimos Ayrton Academy, el curso presencial de barbería.</p>
        <p className="carta-firma">Ayrton</p>
        <p className="carta-rol">Fundador de Ayrton Estilistas</p>
        <a className="carta-tira" href={`https://instagram.com/${negocio.instagram}`} target="_blank" rel="noreferrer">
          Seguinos en Instagram <span>@{negocio.instagram}</span>
        </a>
      </article>
    </section>
  )
}

function Sucursales() {
  const e = useDemo()
  const [suc, setSuc] = useState<SucursalId>('nuevo')
  const ref = useRevelar<HTMLElement>()
  const s = negocio.sucursales.find((x) => x.id === suc)!
  const equipo = e.equipo.filter((b) => b.sucursal === suc)
  return (
    <section id="sucursales" className="sucursales" ref={ref}>
      <div className="sucursales-foto revela">
        <img src="img/sillon.jpg" alt="Grabado de un sillón de barbero hidráulico de 1903" width={1400} height={1251} loading="lazy" />
      </div>
      <div className="sucursales-texto">
        <div className="revela">
          <h2>Dos sucursales en el centro</h2>
          <div className="pestanas pestanas-grandes" role="tablist" aria-label="Sucursal">
            {negocio.sucursales.map((x) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={suc === x.id}
                className={suc === x.id ? 'activa' : ''}
                onClick={() => setSuc(x.id)}
              >
                {x.nombre}
              </button>
            ))}
          </div>
        </div>
        <div className="revela" key={suc}>
          <h3 className="sucursal-direccion">{s.direccion}</h3>
          <p>
            Te atienden {equipo.map((b) => b.nombre).join(', ').replace(/, ([^,]*)$/, ' y $1')}.
            {suc === 'nuevo'
              ? ' Es la sucursal grande: cuatro sillones, abierta también los domingos a la tarde.'
              : ' Más tranquila, con horario cortado al mediodía.'}
          </p>
          <dl className="horario">
            {filasHorario(suc).map((f) => (
              <div key={f.dias}>
                <dt>{f.dias}</dt>
                <dd>{f.horas}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="sucursales-acciones revela">
          <Link className="celda celda-tinta" to={`/reservar?suc=${suc}`}>
            Sacar turno en {s.nombre}
          </Link>
          <a className="celda celda-tono" href={s.mapa} target="_blank" rel="noreferrer">
            Cómo llegar
          </a>
        </div>
      </div>
    </section>
  )
}

function Contacto() {
  const ref = useRevelar<HTMLElement>()
  return (
    <section className="contacto" ref={ref} aria-labelledby="contacto-titulo">
      <img className="contacto-foto" src="img/lago.jpg" alt="El lago San Roque y las sierras desde la costanera" width={1920} height={1285} loading="lazy" />
      <div className="contacto-tarjeta revela">
        <h2 id="contacto-titulo">Consultas</h2>
        {negocio.sucursales.map((s) => (
          <p key={s.id} className="contacto-linea">
            <span>{s.nombre}</span>
            <a href={`https://wa.me/54${s.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
              WhatsApp {s.telefono}
            </a>
          </p>
        ))}
        <p className="contacto-nota">
          Para color o mechas reservamos la tarde entera: escribinos antes y te pasamos una idea del resultado.
        </p>
        <Link className="btn btn-acento btn-ancho" to="/reservar">
          Sacar turno
        </Link>
      </div>
    </section>
  )
}

function Pie() {
  return (
    <footer className="pie">
      <div className="pie-postal">
        <div className="pie-mensaje">
          <h2>Nos vemos en el sillón.</h2>
          <p>
            {negocio.calificacion.promedio.toFixed(1)} de 5 en {negocio.calificacion.reseñas} reseñas de clientes que reservaron
            online. Gracias por elegirnos.
          </p>
        </div>
        <div className="pie-datos">
          <img className="pie-sello" src="img/reloj-cucu.jpg" alt="El reloj cucú de Villa Carlos Paz" width={88} height={117} loading="lazy" />
          <a href={`https://instagram.com/${negocio.instagram}`} target="_blank" rel="noreferrer">@{negocio.instagram}</a>
          {negocio.sucursales.map((s) => (
            <a key={s.id} href={s.mapa} target="_blank" rel="noreferrer">
              {s.direccion}, {s.nombre}
            </a>
          ))}
          <Link to="/admin">Panel del negocio</Link>
        </div>
        <p className="pie-imprenta">
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
      <Portada />
      <main>
        <Servicios />
        <Carta />
        <Sucursales />
        <Contacto />
      </main>
      <Pie />
    </div>
  )
}
