# Sillón · demo para Ayrton Estilistas

Demo visual de un sistema de turnos para barberías y peluquerías, armada para mostrársela a
**Ayrton Estilistas** (Villa Carlos Paz). Es todo frontend: no hay servidor ni base de datos.
Los datos de prueba se generan solos y se guardan en el navegador de quien la abre.

- **Web pública** (`#/`): la página de la barbería con el próximo turno libre en vivo y la reserva en 5 pasos.
- **Panel del negocio** (`#/admin`): agenda por barbero, clientes, caja, reportes, servicios y precios, equipo y comisiones.

Lo que se reserva en la web aparece en la agenda del panel. El botón **Reiniciar demo** del panel vuelve todo a cero.

## Correrlo en la compu

```bash
npm install
npm run dev
```

## Publicarlo en GitHub Pages

1. Crear un repo en GitHub y subir esta carpeta a la rama `main`.
2. En el repo: **Settings → Pages → Source: GitHub Actions**.
3. Cada push a `main` publica solo (`.github/workflows/deploy.yml`).
   El link queda como `https://<usuario>.github.io/<repo>/`.

Links para mandar:

- Web de turnos: `https://<usuario>.github.io/<repo>/`
- Panel del dueño: `https://<usuario>.github.io/<repo>/#/admin`

## Hacer la demo para otra peluquería

Todo lo del negocio está en [`src/config/negocio.ts`](src/config/negocio.ts): nombre, sucursales,
horarios, servicios, precios, equipo y productos. Se cambia ese archivo y listo.
Los textos de la portada y la carta del dueño están en [`src/sitio/Sitio.tsx`](src/sitio/Sitio.tsx).

## Antes de mostrarla: qué es real y qué es de muestra

**Real** (tomado de su Instagram y de su página de turnos actual): nombre, las dos sucursales y direcciones,
horarios, teléfonos, el equipo (Agus, Benja, Blas, Lucas, Fede), los precios de Corte, Corte y barba, Color global
y Mechas platinadas, la calificación 5.0 en 38 reseñas y Ayrton Academy.

**De muestra** (confirmar o cambiar): Corte niños y Barba sola con sus precios, los francos y comisiones del equipo,
los productos y su stock, la carta firmada por Ayrton y todos los clientes y turnos.

**Fotos**: son fotos libres de Wikimedia Commons (barberías antiguas, el lago San Roque, el reloj cucú), con
sus créditos en el pie de la página. No son del local. Lo ideal es reemplazarlas por fotos de Ayrton en
`public/img/` con los mismos nombres de archivo.
