import { useEffect, useRef, type ReactNode } from 'react'
import { negocio } from '../config/negocio'

/** El logo del negocio. Ayrton: el corazón invertido con la tijera, como el cartel de neón del local. */
export function Logo({ tamaño = 36, className = '' }: { tamaño?: number; className?: string }) {
  if (negocio.id === 'filo')
    // Filo: el cuadrado con el filo de la navaja en diagonal
    return (
      <svg className={`logo ${className}`} width={tamaño} height={tamaño} viewBox="0 0 100 100" aria-hidden="true">
        <rect className="logo-forma" x="6" y="6" width="88" height="88" rx="26" />
        <g className="logo-tijera" fill="none" strokeLinecap="round">
          <path d="M27 73L73 27" strokeWidth="9" />
          <path d="M40 75L75 40" strokeWidth="4" />
        </g>
      </svg>
    )
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
