// Barbería Filo: un negocio inventado para mostrarle el sistema a cualquier barbería.
// Nombres, direcciones, teléfonos y reseñas son de ejemplo. Las fotos son de Wikimedia Commons.
import { lunesASabado, type Foto, type Negocio } from './tipos'

const f: Record<string, Foto> = {
  salon: { src: 'img/filo/salon.jpg', ancho: 801, alto: 1200, alt: 'Un barbero corta el pelo con máquina frente al espejo del salón', titulo: 'El salón', autor: 'Nenad Stojkovic' },
  peine: { src: 'img/filo/peine.jpg', ancho: 801, alto: 1200, alt: 'Corte con peine y máquina, visto de atrás', titulo: 'Tijera y peine', autor: 'Nenad Stojkovic' },
  fade: { src: 'img/filo/fade.jpg', ancho: 960, alto: 1200, alt: 'Mid fade con la línea marcada, de perfil', titulo: 'Mid fade', autor: 'Classic Barbers' },
  rayo: { src: 'img/filo/rayo.jpg', ancho: 751, alto: 1200, alt: 'Fade con un rayo marcado a navaja al costado', titulo: 'Fade con diseño', autor: 'Classic Barbers' },
  corazon: { src: 'img/filo/corazon.jpg', ancho: 1200, alto: 794, alt: 'Fade con barba y un corazón marcado en la sien', titulo: 'Diseño a navaja', autor: 'Classic Barbers' },
  perfil: { src: 'img/filo/perfil.jpg', ancho: 1200, alto: 787, alt: 'Corte corto con la frente marcada, de perfil', titulo: 'Perfilado', autor: 'Classic Barbers' },
  tijera: { src: 'img/filo/tijera.jpg', ancho: 1200, alto: 801, alt: 'El barbero termina un corte con peine y máquina', titulo: 'Terminación', autor: 'Nenad Stojkovic' },
}

export const filo: Negocio = {
  id: 'filo',
  nombre: 'Barbería Filo',
  nombreCorto: 'Filo',
  rubro: 'Barbería',
  ciudad: 'Córdoba',
  provincia: 'Córdoba',
  instagram: 'filo.barberia',
  dueño: 'Nico',
  inventado: true,
  bajada: 'Fades, diseños a navaja y barba con toalla caliente. Dos locales en Córdoba y turnos online, sin seña y sin llamar.',
  // Verde de barbería clásica sobre negro
  colores: { acento: '#0f8a5f', hover: '#0b744f', claro: '#e3f4ec', tenue: '#c4ecd9', tinta: '#0a6644' },
  calificacion: { promedio: 4.9, reseñas: 312 },

  reseñas: [
    { nombre: 'Franco R.', cuando: 'hace 2 semanas', texto: 'Saqué turno desde el celu en un minuto y a la hora justa me estaban esperando. El fade, impecable.' },
    { nombre: 'Martín G.', cuando: 'hace 1 mes', texto: 'Nico es un crack con la navaja. Le mostré una foto y me hizo el diseño igual.' },
    { nombre: 'Lucía P.', cuando: 'hace 1 mes', texto: 'Llevé a mi hijo de 8 años y lo atendieron con una paciencia bárbara. Volvemos seguro.' },
    { nombre: 'Ezequiel B.', cuando: 'hace 2 meses', texto: 'La barba con toalla caliente vale cada peso. Buen ambiente y buena música.' },
    { nombre: 'Tomás V.', cuando: 'hace 2 meses', texto: 'Me avisaron por WhatsApp el día antes del turno. Cero espera.' },
    { nombre: 'Gonzalo A.', cuando: 'hace 3 meses', texto: 'El mejor corte que me hice en Córdoba. Precio justo.' },
  ],

  fotos: {
    portada: [f.salon, f.fade, f.peine],
    trabajos: [f.rayo, f.corazon, f.perfil, f.fade, f.tijera, f.peine],
  },
  local: [
    { titulo: 'Barba con toalla caliente', texto: 'Perfilado a navaja, toalla caliente y aceite. Media hora para vos, en cualquiera de los dos locales.', foto: f.tijera },
    {
      titulo: 'Regalá un corte',
      texto: 'Gift card para cumpleaños o el Día del Padre. La pedís por WhatsApp y te la mandamos lista para regalar.',
      foto: f.corazon,
      acento: true,
      boton: 'Pedir gift card por WhatsApp',
      whatsapp: 'Hola! Quiero una gift card de Barbería Filo',
    },
  ],
  creditos: {
    texto: 'Fotos de Wikimedia Commons',
    enlaces: [
      { texto: 'Nenad Stojkovic (CC BY 2.0)', url: 'https://commons.wikimedia.org/wiki/File:Young_men_with_trendy_haircut_at_barber_shop.jpg' },
      { texto: 'Classic Barbers (CC0)', url: 'https://commons.wikimedia.org/wiki/File:Mid-fade_06.jpg' },
    ],
  },

  sucursales: [
    {
      id: 'centro',
      nombre: 'Centro',
      direccion: 'Obispo Trejo 340',
      ciudad: 'Córdoba',
      telefono: '351 555-0190',
      mapa: 'https://maps.google.com/?q=Obispo+Trejo+340,+Córdoba',
      horario: { ...lunesASabado([['10:00', '20:30']]), 6: [['09:00', '20:00']] },
    },
    {
      id: 'guemes',
      nombre: 'Güemes',
      direccion: 'Belgrano 812',
      ciudad: 'Córdoba',
      telefono: '351 555-0191',
      mapa: 'https://maps.google.com/?q=Belgrano+812,+Córdoba',
      horario: { 2: [['11:00', '20:00']], 3: [['11:00', '20:00']], 4: [['11:00', '20:00']], 5: [['11:00', '21:00']], 6: [['10:00', '21:00']] },
    },
  ],

  servicios: [
    { id: 'corte', nombre: 'Corte', descripcion: 'Tijera o máquina, con lavado.', grupo: 'Corte', precio: 16000, duracion: 30, online: true },
    { id: 'corte-nino', nombre: 'Corte niños', descripcion: 'Hasta 12 años.', grupo: 'Corte', precio: 13000, duracion: 30, online: true },
    { id: 'corte-barba', nombre: 'Corte y barba', descripcion: 'Corte y barba con toalla caliente.', grupo: 'Barba', precio: 22000, duracion: 45, online: true },
    { id: 'barba', nombre: 'Barba', descripcion: 'Perfilado a navaja y toalla caliente.', grupo: 'Barba', precio: 9000, duracion: 20, online: true },
    { id: 'color', nombre: 'Color', descripcion: 'Incluye corte. Se reserva la tarde.', grupo: 'Color', precio: 70000, duracion: 240, online: true },
    { id: 'mechas', nombre: 'Platinado', descripcion: 'Incluye corte. Decoloración y matiz.', grupo: 'Color', precio: 85000, duracion: 300, online: true },
  ],

  equipo: [
    { id: 'nico', nombre: 'Nico', sucursal: 'centro', tono: 150, comision: 50, desde: '2019', franco: 1 },
    { id: 'mati', nombre: 'Mati', sucursal: 'centro', tono: 30, comision: 45, desde: '2022', franco: 2 },
    { id: 'tomi', nombre: 'Tomi', sucursal: 'centro', tono: 210, comision: 45, desde: '2023', franco: 3 },
    { id: 'juli', nombre: 'Juli', sucursal: 'guemes', tono: 320, comision: 50, desde: '2021' },
    { id: 'santi', nombre: 'Santi', sucursal: 'guemes', tono: 265, comision: 45, desde: '2024' },
  ],

  productos: [
    { id: 'pomada', nombre: 'Pomada mate', precio: 11000, stock: 12 },
    { id: 'cera', nombre: 'Cera de brillo', precio: 10000, stock: 8 },
    { id: 'aceite', nombre: 'Aceite para barba', precio: 9000, stock: 3 },
    { id: 'shampoo', nombre: 'Shampoo', precio: 12000, stock: 6 },
  ],
}
