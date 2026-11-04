// Ayrton Estilistas, Villa Carlos Paz: la demo hecha con los datos reales del local.
// Lo marcado como "muestra" es contenido de ejemplo: confirmarlo con el cliente.
import { lunesASabado, type Foto, type Negocio } from './tipos'

const f: Record<string, Foto> = {
  salon: { src: 'img/salon.jpg', ancho: 720, alto: 1280, alt: 'Un barbero corta a un cliente bajo el techo de hexágonos de luz', titulo: 'Centro Nuevo', autor: 'fecasstyle' },
  neon: { src: 'img/neon.jpg', ancho: 1215, alto: 2160, alt: 'El logo de Ayrton en neón violeta sobre la pared de mármol de Centro Viejo', titulo: 'Centro Viejo', autor: 'fecasstyle' },
  mechas: { src: 'img/mechas.jpg', ancho: 720, alto: 1280, alt: 'Mechas en proceso con gorro de papel', titulo: 'Mechas en proceso', autor: 'ltbarberia_' },
  mullet: { src: 'img/mullet.jpg', ancho: 720, alto: 1280, alt: 'Mullet con mechas iluminadas, de perfil', titulo: 'Mullet con mechas', autor: 'ltbarberia_' },
  diseno: { src: 'img/diseno.jpg', ancho: 1320, alto: 2347, alt: 'Fade con diseño a navaja en la nuca', titulo: 'Fade con diseño', autor: 'ayrton.estilistas' },
  cafe: { src: 'img/cafe.jpg', ancho: 640, alto: 1136, alt: 'Un cliente toma café en el nuevo sector de cafetería', titulo: 'El café de la casa', autor: 'ayrton.estilistas' },
}

export const ayrton: Negocio = {
  id: 'ayrton',
  nombre: 'Ayrton Estilistas',
  nombreCorto: 'Ayrton',
  rubro: 'Barbería',
  ciudad: 'Villa Carlos Paz',
  provincia: 'Córdoba',
  instagram: 'ayrton.estilistas',
  dueño: 'Ayrton',
  inventado: false,
  bajada: 'Barbería en Villa Carlos Paz, para niños y mayores. Dos locales en el centro, café de la casa y turnos online sin seña.',
  // El violeta del cartel de neón del local
  colores: { acento: '#5440f5', hover: '#4431de', claro: '#efedff', tenue: '#e4e0ff', tinta: '#3a28c9' },
  // Ficha de Google de Centro Nuevo, noviembre 2026
  calificacion: { promedio: 4.8, reseñas: 246 },
  google: 'https://www.google.com/maps/search/?api=1&query=Ayrton+Estilistas&query_place_id=ChIJUTB-aKZnLZQR9Um6g6ZeetE',

  // Extractos de reseñas reales de Google (5 estrellas). En la versión final se leen solas de Google.
  reseñas: [
    { nombre: 'Mayco A.', cuando: 'hace 4 meses', texto: 'Excelente el servicio de los chicos, Blas y Lucas genios. Súper profesionales y correctos.' },
    { nombre: 'Andrés F.', cuando: 'hace 5 meses', texto: 'Todos los chicos le ponen toda la buena onda, desde que abrieron fiel acá. Hasta con cafecito te reciben.' },
    { nombre: 'Jonathan', cuando: 'hace 3 meses', texto: 'Siempre voy porque interpretan bien el corte que querés, capo los pibes.' },
    { nombre: 'Agustina M.', cuando: 'hace 6 meses', texto: 'Excelente ambiente, muy buena onda los chicos, muy buena atención y servicio.' },
    { nombre: 'Cliente en Google', cuando: 'reseña destacada', texto: 'Muy buena atención y una excelente calidad en los cortes… te dejan flama.' },
    { nombre: 'Cliente en Google', cuando: 'reseña destacada', texto: 'Con mi hijo nos atendieron espectacular.' },
    { nombre: 'Cliente en Google', cuando: 'reseña destacada', texto: 'Muy buen lugar, te tratan súper bien.' },
  ],

  // Fotos de su Instagram y de los barberos (posts en colaboración con @ayrton.estilistas)
  fotos: {
    portada: [f.salon, f.neon, f.mullet],
    trabajos: [f.diseno, f.mullet, f.mechas, f.salon, f.neon, f.cafe],
  },
  local: [
    { titulo: 'Café mientras esperás', texto: 'Si llegás antes o venís a acompañar a alguien, en Centro Nuevo te servimos un café.', foto: f.cafe },
    {
      titulo: 'Ayrton Academy',
      texto: 'Curso presencial de barbería 2026, en el salón y con clientes reales. Cupos chicos.',
      foto: f.neon,
      acento: true,
      boton: 'Pedir info por WhatsApp',
      whatsapp: 'Hola! Quiero info del curso de barbería de Ayrton Academy',
    },
  ],
  creditos: {
    texto: 'Fotos de Instagram',
    enlaces: ['fecasstyle', 'ltbarberia_', 'ayrton.estilistas'].map((a) => ({ texto: `@${a}`, url: `https://instagram.com/${a}` })),
  },

  sucursales: [
    {
      id: 'nuevo',
      nombre: 'Centro Nuevo',
      direccion: 'José Ingenieros 90',
      ciudad: 'Villa Carlos Paz',
      telefono: '3541 20-3430',
      mapa: 'https://maps.google.com/?q=José+Ingenieros+90,+Villa+Carlos+Paz',
      horario: { ...lunesASabado([['10:00', '20:30']]), 0: [['17:00', '20:30']] },
    },
    {
      id: 'viejo',
      nombre: 'Centro Viejo',
      direccion: 'Bv. Sarmiento 280',
      ciudad: 'Villa Carlos Paz',
      telefono: '3541 56-8019',
      mapa: 'https://maps.google.com/?q=Boulevard+Sarmiento+280,+Villa+Carlos+Paz',
      horario: lunesASabado([['10:00', '13:00'], ['16:30', '20:30']]),
    },
  ],

  servicios: [
    { id: 'corte', nombre: 'Corte', descripcion: 'Tijera o máquina, con lavado y peinado.', grupo: 'Corte', precio: 18000, duracion: 30, online: true },
    { id: 'corte-nino', nombre: 'Corte niños', descripcion: 'Hasta 12 años.', grupo: 'Corte', precio: 15000, duracion: 30, online: true, muestra: true },
    { id: 'corte-barba', nombre: 'Corte y barba', descripcion: 'Corte completo y barba con toalla caliente.', grupo: 'Barba', precio: 25000, duracion: 45, online: true },
    { id: 'barba', nombre: 'Barba', descripcion: 'Perfilado a navaja y toalla caliente.', grupo: 'Barba', precio: 10000, duracion: 20, online: true, muestra: true },
    { id: 'color', nombre: 'Color global', descripcion: 'Incluye corte. Se reserva la tarde.', grupo: 'Color', precio: 90000, duracion: 240, online: true },
    { id: 'mechas', nombre: 'Mechas platinadas', descripcion: 'Incluye corte. Decoloración y matiz.', grupo: 'Color', precio: 90000, duracion: 300, online: true },
  ],

  // Equipo según su página de turnos e Instagram; tonos y comisiones son de muestra.
  equipo: [
    { id: 'agus', nombre: 'Agus', sucursal: 'nuevo', tono: 28, comision: 50, desde: '2022', franco: 1, instagram: 'agustin.jbucc' },
    { id: 'benja', nombre: 'Benja', sucursal: 'nuevo', tono: 160, comision: 45, desde: '2024', franco: 2 },
    { id: 'blas', nombre: 'Blas', sucursal: 'nuevo', tono: 205, comision: 50, desde: '2021', franco: 3 },
    { id: 'lucas', nombre: 'Lucas', sucursal: 'nuevo', tono: 320, comision: 45, desde: '2023', franco: 4, instagram: 'ltbarberia_' },
    { id: 'fede', nombre: 'Fede', sucursal: 'viejo', tono: 95, comision: 50, desde: '2022', instagram: 'fecasstyle' },
  ],

  productos: [
    { id: 'pomada', nombre: 'Pomada mate', precio: 12000, stock: 14, muestra: true },
    { id: 'cera', nombre: 'Cera de brillo', precio: 11000, stock: 9, muestra: true },
    { id: 'aceite', nombre: 'Aceite para barba', precio: 9500, stock: 3, muestra: true },
    { id: 'shampoo', nombre: 'Shampoo matizador', precio: 14000, stock: 6, muestra: true },
  ],
}
