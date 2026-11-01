import { useEffect, useId, useRef, type ReactNode } from 'react'

/** Marca la sección como vista al entrar en pantalla, para la animación de entrada. */
export function useRevelar<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Se mide con el scroll (no con IntersectionObserver) para que funcione también en pestañas en segundo plano
    const mirar = () => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
        el.classList.add('visto')
        quitar()
      }
    }
    const quitar = () => {
      window.removeEventListener('scroll', mirar)
      window.removeEventListener('resize', mirar)
    }
    window.addEventListener('scroll', mirar, { passive: true })
    window.addEventListener('resize', mirar)
    mirar()
    return quitar
  }, [])
  return ref
}

/** La franja del poste de barbero, en los colores del local: neón, blanco y negro. Gira despacio. */
export function Franja({ alto = 56, className = '' }: { alto?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  const paso = 18
  return (
    <div className={`franja ${className}`} style={{ height: alto }} aria-hidden="true">
      <svg width="100%" height={alto}>
        <defs>
          <pattern id={id} width={paso * 4} height={alto} patternUnits="userSpaceOnUse" patternTransform="skewX(-40)">
            <rect x={0} width={paso} height={alto} fill="var(--neon-fuerte)" />
            <rect x={paso} width={paso} height={alto} fill="var(--blanco)" />
            <rect x={paso * 2} width={paso} height={alto} fill="var(--negro)" />
            <rect x={paso * 3} width={paso} height={alto} fill="var(--blanco)" />
          </pattern>
        </defs>
        <rect className="franja-giro" x={-paso * 4} width="130%" height={alto} fill={`url(#${id})`} />
      </svg>
    </div>
  )
}

/** El logo de Ayrton: el corazón invertido con la tijera, como el cartel de neón del local. */
export function Logo({ tamaño = 36, className = '' }: { tamaño?: number; className?: string }) {
  return (
    <svg className={`logo ${className}`} width={tamaño} height={tamaño} viewBox="0 0 100 100" aria-hidden="true">
      <path
        className="logo-forma"
        d="M50 6C78 6 96 26 96 52c0 22-10 40-26 40-10 0-16-6-20-12-4 6-10 12-20 12C14 92 4 74 4 52 4 26 22 6 50 6z"
      />
      <g className="logo-tijera" fill="none" strokeWidth="4" strokeLinecap="round">
        <circle cx="62" cy="76" r="5" />
        <circle cx="76" cy="70" r="5" />
        <path d="M66 72l14-18M72 67l-12-13" />
      </g>
    </svg>
  )
}

/** Hexágono de lado 1 con centro (cx, cy), como los tubos de luz del techo del local. */
const hexagono = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')

/** El techo de hexágonos de LED, dibujado como líneas de luz. */
export function Techo({ columnas = 9, filas = 3, r = 60, className = '' }: { columnas?: number; filas?: number; r?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  const w = r * 1.5
  const h = r * Math.sqrt(3)
  const celdas: string[] = []
  for (let c = 0; c < columnas; c++)
    for (let f = 0; f < filas + 1; f++) celdas.push(hexagono(c * w, f * h + (c % 2 ? h / 2 : 0), r - 7))
  return (
    <svg
      className={`techo ${className}`}
      viewBox={`${r * 0.5} ${h * 0.3} ${(columnas - 1) * w} ${filas * h}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        {celdas.map((p, i) => (
          <polygon key={i} points={p} />
        ))}
      </g>
    </svg>
  )
}

export function Dialogo({
  abierto,
  cerrar,
  titulo,
  children,
  ancho = 480,
}: {
  abierto: boolean
  cerrar: () => void
  titulo: string
  children: ReactNode
  ancho?: number
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])
  return (
    <dialog
      ref={ref}
      className="dialogo"
      style={{ width: `min(${ancho}px, calc(100vw - 24px))` }}
      onClose={cerrar}
      onClick={(e) => e.target === ref.current && cerrar()}
    >
      {abierto && (
        <div className="dialogo-cuerpo">
          <header className="dialogo-cabeza">
            <h2>{titulo}</h2>
            <button type="button" className="btn-icono" onClick={cerrar} aria-label="Cerrar">
              ×
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}
