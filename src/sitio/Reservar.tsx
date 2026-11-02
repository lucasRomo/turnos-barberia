import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { negocio, type SucursalId } from '../config/negocio'
import { duracion, fechaCorta, fechaLarga, fechaRelativa, hora, hoyClave, pesos, sumarDias, capital } from '../lib/formato'
import { abierto, crearCliente, crearTurno, huecos, useDemo } from '../lib/store'
import type { Turno } from '../lib/tipos'
import { ChevronLeft } from 'lucide-react'
import { Logo } from '../lib/ui'
import { BarraDemo } from './comun'

function Paso({
  n,
  titulo,
  resumen,
  abiertoPaso,
  editar,
  children,
}: {
  n: number
  titulo: string
  resumen?: string
  abiertoPaso: boolean
  editar?: () => void
  children: React.ReactNode
}) {
  return (
    <section className={`paso ${abiertoPaso ? 'paso-abierto' : ''} ${!abiertoPaso && resumen ? 'paso-hecho' : ''}`}>
      <div className="paso-cabeza">
        <span className="paso-numero" aria-hidden="true">{n}</span>
        <h2>{titulo}</h2>
        {!abiertoPaso && resumen && (
          <p className="paso-resumen">
            {resumen}
            {editar && (
              <button type="button" className="enlace" onClick={editar}>
                Cambiar
              </button>
            )}
          </p>
        )}
      </div>
      {abiertoPaso && <div className="paso-cuerpo">{children}</div>}
    </section>
  )
}

function CabeceraReserva() {
  return (
    <header className="cabecera">
      <Link to="/" className="volver" aria-label="Volver al inicio">
        <ChevronLeft size={22} aria-hidden="true" />
      </Link>
      <Link to="/" className="marca">
        <Logo tamaño={28} />
        <span>{negocio.nombre}</span>
      </Link>
    </header>
  )
}

export default function Reservar() {
  const e = useDemo()
  const [q] = useSearchParams()
  const hoy = hoyClave()

  const [suc, setSuc] = useState<SucursalId | null>((q.get('suc') as SucursalId) || null)
  const [servicio, setServicio] = useState<string | null>(q.get('servicio'))
  const [barbero, setBarbero] = useState<string | null>(q.get('barbero') ?? (q.get('suc') ? 'cualquiera' : null))
  const [dia, setDia] = useState<string | null>(q.get('dia'))
  const [inicio, setInicio] = useState<number | null>(q.get('hora') ? Number(q.get('hora')) : null)
  const [nombre, setNombre] = useState('')
  const [tel, setTel] = useState('')
  const [hecho, setHecho] = useState<Turno | null>(null)
  const [editando, setEditando] = useState<string | null>(null)

  useEffect(() => {
    document.title = `Sacar turno · ${negocio.nombre}`
    window.scrollTo(0, 0)
  }, [])

  const s = e.servicios.find((x) => x.id === servicio)
  const sucursal = negocio.sucursales.find((x) => x.id === suc)
  const equipo = e.equipo.filter((b) => b.sucursal === suc)

  const diasAbiertos = useMemo(() => {
    if (!suc) return []
    const lista: string[] = []
    for (let i = 0; lista.length < 10 && i < 21; i++) {
      const d = sumarDias(hoy, i)
      if (abierto(suc, d)) lista.push(d)
    }
    return lista
  }, [suc, hoy])

  const libres = useMemo(
    () => (suc && servicio && dia ? huecos(e, suc, dia, servicio, barbero === 'cualquiera' ? undefined : barbero ?? undefined) : []),
    [e, suc, servicio, dia, barbero],
  )
  const libresPorDia = useMemo(() => {
    const m: Record<string, number> = {}
    if (suc && servicio)
      for (const d of diasAbiertos) m[d] = huecos(e, suc, d, servicio, barbero === 'cualquiera' ? undefined : barbero ?? undefined).length
    return m
  }, [e, suc, servicio, barbero, diasAbiertos])

  // Paso actual: el primero que falta, o el que se está cambiando
  const falta = !suc ? 'suc' : !servicio ? 'servicio' : !barbero ? 'barbero' : dia === null || inicio === null ? 'hora' : 'datos'
  const actual = editando ?? falta
  const elegido = (paso: string, f: () => void) => {
    f()
    if (editando === paso) setEditando(null)
  }

  const hueco = libres.find((h) => h.inicio === inicio)
  const barberoFinal = barbero && barbero !== 'cualquiera' ? barbero : hueco?.barberoId

  function confirmar(ev: FormEvent) {
    ev.preventDefault()
    if (!suc || !servicio || !dia || inicio === null || !barberoFinal) return
    const cliente = crearCliente({ nombre: nombre.trim(), telefono: tel.trim() })
    const t = crearTurno({ clienteId: cliente.id, barberoId: barberoFinal, servicioId: servicio, sucursal: suc, dia, inicio, origen: 'web' })
    setHecho(t)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (hecho) {
    const b = e.equipo.find((x) => x.id === hecho.barberoId)!
    const sv = e.servicios.find((x) => x.id === hecho.servicioId)!
    const sc = negocio.sucursales.find((x) => x.id === hecho.sucursal)!
    return (
      <div className="reservar">
        <BarraDemo a={`/admin/agenda?dia=${hecho.dia}&suc=${hecho.sucursal}`} texto="Ver el turno en la agenda del negocio" />
        <CabeceraReserva />
        <main className="reservar-cuerpo">
          <section className="confirmado" aria-live="polite">
            <p className="confirmado-sello">Turno confirmado</p>
            <h1>
              {capital(fechaRelativa(hecho.dia) === 'hoy' || fechaRelativa(hecho.dia) === 'mañana' ? fechaRelativa(hecho.dia) : fechaLarga(hecho.dia))} a las {hora(hecho.inicio)}
            </h1>
            <dl className="confirmado-datos">
              <div><dt>Servicio</dt><dd>{sv.nombre}, {pesos(sv.precio)}</dd></div>
              <div><dt>Barbero</dt><dd>{b.nombre}</dd></div>
              <div><dt>Dónde</dt><dd>{sc.direccion}, {sc.nombre}</dd></div>
              <div><dt>A nombre de</dt><dd>{nombre}</dd></div>
              <div><dt>Número</dt><dd>{hecho.numero}</dd></div>
            </dl>
            <p>Te mandamos un recordatorio por WhatsApp el día anterior. Si no podés venir, avisanos y liberamos el lugar.</p>
            <div className="confirmado-acciones">
              <a className="btn btn-primario" href={sc.mapa} target="_blank" rel="noreferrer">Cómo llegar</a>
              <Link className="btn btn-secundario" to="/">Volver al inicio</Link>
            </div>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="reservar">
      <BarraDemo />
      <CabeceraReserva />
      <main className="reservar-cuerpo">
        <div className="reservar-titulo">
          <h1>Sacá tu turno</h1>
          <p>No hace falta registrarse ni pagar por adelantado.</p>
        </div>

          <Paso n={1} titulo="Sucursal" abiertoPaso={actual === 'suc'} resumen={sucursal && `${sucursal.nombre}, ${sucursal.direccion}`} editar={() => setEditando('suc')}>
            <div className="opciones">
              {negocio.sucursales.map((x) => (
                <button key={x.id} className="opcion" onClick={() => elegido('suc', () => { setSuc(x.id); setBarbero('cualquiera'); setDia(null); setInicio(null) })}>
                  <span className="opcion-nombre">{x.nombre}</span>
                  <span className="opcion-dato">{x.direccion}</span>
                </button>
              ))}
            </div>
          </Paso>

          <Paso n={2} titulo="Servicio" abiertoPaso={actual === 'servicio'} resumen={s && `${s.nombre}, ${pesos(s.precio)}, ${duracion(s.duracion)}`} editar={() => setEditando('servicio')}>
            <div className="opciones">
              {e.servicios.filter((x) => x.online).map((x) => (
                <button key={x.id} className="opcion" onClick={() => elegido('servicio', () => { setServicio(x.id); setInicio(null) })}>
                  <span className="opcion-nombre">{x.nombre}</span>
                  <span className="opcion-precio">{pesos(x.precio)}</span>
                  <span className="opcion-dato">{duracion(x.duracion)}. {x.descripcion}</span>
                </button>
              ))}
            </div>
          </Paso>

          <Paso
            n={3}
            titulo="Barbero"
            abiertoPaso={actual === 'barbero'}
            resumen={barbero === 'cualquiera' ? 'El primero que esté libre' : equipo.find((b) => b.id === barbero)?.nombre}
            editar={() => setEditando('barbero')}
          >
            <div className="opciones opciones-barberos">
              {equipo.length > 1 && (
                <button className="opcion" onClick={() => elegido('barbero', () => { setBarbero('cualquiera'); setInicio(null) })}>
                  <span className="opcion-nombre">El primero libre</span>
                  <span className="opcion-dato">Más horarios para elegir</span>
                </button>
              )}
              {equipo.map((b) => (
                <button key={b.id} className="opcion" onClick={() => elegido('barbero', () => { setBarbero(b.id); setInicio(null) })}>
                  <span className="avatar" style={{ ['--tono' as string]: b.tono }} aria-hidden="true">{b.nombre[0]}</span>
                  <span className="opcion-nombre">{b.nombre}</span>
                  <span className="opcion-dato">En el equipo desde {b.desde}</span>
                </button>
              ))}
            </div>
          </Paso>

          <Paso
            n={4}
            titulo="Día y hora"
            abiertoPaso={actual === 'hora'}
            resumen={dia && inicio !== null ? `${capital(fechaRelativa(dia))}, ${hora(inicio)}` : undefined}
            editar={() => setEditando('hora')}
          >
            <div className="dias" role="listbox" aria-label="Día">
              {diasAbiertos.map((d) => (
                <button
                  key={d}
                  role="option"
                  aria-selected={dia === d}
                  className={`dia ${dia === d ? 'activa' : ''}`}
                  disabled={!libresPorDia[d]}
                  onClick={() => { setDia(d); setInicio(null) }}
                >
                  <span>{d === hoy ? 'Hoy' : fechaCorta(d).split(' ')[0]}</span>
                  <strong>{Number(d.slice(8))}</strong>
                  <small>{libresPorDia[d] ? `${libresPorDia[d]} libres` : 'Completo'}</small>
                </button>
              ))}
            </div>
            {dia && (
              <div className="horas">
                {libres.length === 0 && <p className="paso-resumen">No quedan horarios este día. Probá con otro.</p>}
                {libres.map((h) => (
                  <button key={h.inicio} className="hora" onClick={() => elegido('hora', () => setInicio(h.inicio))}>
                    {hora(h.inicio)}
                  </button>
                ))}
              </div>
            )}
          </Paso>

          <Paso n={5} titulo="Tus datos" abiertoPaso={actual === 'datos'}>
            <form className="datos" onSubmit={confirmar}>
              <label>
                Nombre y apellido
                <input required name="nombre" value={nombre} onChange={(ev) => setNombre(ev.target.value)} autoComplete="name" />
              </label>
              <label>
                WhatsApp
                <input required name="telefono" type="tel" value={tel} onChange={(ev) => setTel(ev.target.value)} inputMode="tel" autoComplete="tel" placeholder="3541 00-0000…" aria-describedby="tel-ayuda" />
                <small id="tel-ayuda">Por acá te llega la confirmación y el recordatorio.</small>
              </label>
              {s && dia && inicio !== null && (
                <p className="datos-resumen">
                  {s.nombre} con {equipo.find((b) => b.id === barberoFinal)?.nombre ?? 'el primero libre'}, {fechaRelativa(dia)} a las {hora(inicio)}. Total {pesos(s.precio)}, se paga en el local.
                </p>
              )}
              <button className="btn btn-primario btn-ancho" type="submit">
                Confirmar turno
              </button>
            </form>
          </Paso>
      </main>
    </div>
  )
}
