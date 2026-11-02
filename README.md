# Sillón · demo para Ayrton Estilistas

Demo visual de un sistema de turnos para barberías y peluquerías, armada para mostrársela a
**Ayrton Estilistas** (Villa Carlos Paz). Es todo frontend: no hay servidor ni base de datos.
Los datos de prueba se generan solos y se guardan en el navegador de quien la abre.

- **Web pública** (`#/`): la ficha de la barbería como en una app de turnos, pensada primero para el celular: galería,
  próximo turno libre por sucursal, servicios con su botón de reservar, trabajos de su Instagram, equipo, reseñas de
  Google, sucursales con horario y si están abiertas ahora, y una barra fija abajo para sacar turno. Reserva en 5 pasos.
- **Panel del negocio** (`#/admin`): quién está en cada sillón ahora, agenda tipo calendario (vista día por barbero
  y vista semana de ocupación), clientes, caja, reportes, servicios y precios, equipo y comisiones.

El diseño usa los colores del local (blanco y mármol, negro y el violeta del cartel de neón) y su logo, sin adornos: en el celular la agenda muestra un barbero por vez.

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
Ahí también están las reseñas y la lista de fotos. Los textos de la web están en [`src/sitio/Sitio.tsx`](src/sitio/Sitio.tsx).

## Antes de mostrarla: qué es real y qué es de muestra

**Real** (tomado de su Instagram, su ficha de Google y su página de turnos actual): nombre, logo, las dos
sucursales y direcciones, horarios, teléfonos, el equipo (Agus, Benja, Blas, Lucas, Fede), los precios de Corte,
Corte y barba, Color global y Mechas platinadas, la calificación de Google (4,8 en 246 reseñas), los extractos de
reseñas, el sector de cafetería y Ayrton Academy.

**De muestra** (confirmar o cambiar): Corte niños y Barba sola con sus precios, los francos y comisiones del equipo,
los productos y su stock, los textos de café y academia, y todos los clientes y turnos.

**Fotos**: son de su Instagram (@ayrton.estilistas) y de los barberos que publican en colaboración
(@fecasstyle, @ltbarberia_), con el usuario de cada uno en la página. Son miniaturas de reels: para la versión
final conviene pedirles las fotos originales en buena resolución y ponerlas en `public/img/` con los mismos nombres.

**Reseñas**: son extractos cortos de reseñas reales de Google. En la versión con servidor se leen solas de Google.
