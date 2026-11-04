import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Lo que va en el <head> de cada negocio (el resto sale de src/config).
const cabeza: Record<string, { titulo: string; descripcion: string; icono: string }> = {
  filo: {
    titulo: 'Barbería Filo, turnos online en Córdoba',
    descripcion: 'Sacá turno online en Barbería Filo, Centro o Güemes. Demo de Sillón para barberías.',
    icono: 'favicon-filo.svg',
  },
  ayrton: {
    titulo: 'Ayrton Estilistas, barbería en Villa Carlos Paz',
    descripcion: 'Ayrton Estilistas, barbería en Villa Carlos Paz. Sacá turno online en Centro Nuevo o Centro Viejo.',
    icono: 'favicon.svg',
  },
}

// base relativa: el mismo build sirve en GitHub Pages bajo /<repo>/ o en cualquier carpeta.
// "npm run build" arma la barbería inventada en dist/ y Ayrton en dist/ayrton/.
export default defineConfig(({ mode }) => {
  const c = cabeza[mode] ?? cabeza.filo
  return {
    base: './',
    plugins: [
      react(),
      {
        name: 'cabeza-del-negocio',
        transformIndexHtml: (html: string) =>
          html.replace('%TITULO%', c.titulo).replace('%DESCRIPCION%', c.descripcion).replace('%ICONO%', c.icono),
      },
    ],
  }
})
