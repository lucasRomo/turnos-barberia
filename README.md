# Sillón · turnos online para barberías

Demo visual de un sistema de turnos para barberías y peluquerías. Es todo frontend: no hay servidor ni base de datos.
Los datos de prueba se generan solos y se guardan en el navegador de quien la abre.

El mismo código arma dos demos, cada una con sus datos, colores, logo y fotos:

| Demo | Para qué | Datos | Link |
| --- | --- | --- | --- |
| **Barbería Filo** | Mostrársela a cualquier barbería | [`src/config/filo.ts`](src/config/filo.ts), inventada | `https://lucasromo.github.io/turnos-barberia/` |
| **Ayrton Estilistas** | La propuesta para Ayrton | [`src/config/ayrton.ts`](src/config/ayrton.ts), datos reales | `https://lucasromo.github.io/turnos-barberia/ayrton/` |

- **Web pública** (`#/`): la ficha de la barbería como en una app de turnos, pensada primero para el celular: fotos,
  próximo turno libre por sucursal, precios, trabajos, equipo con el próximo lugar de cada uno, reseñas,
  sucursales con horario y si están abiertas ahora, y una barra fija abajo para sacar turno. Reserva en 5 pasos.
- **Panel del negocio** (`#/admin`): quién está en cada sillón ahora, agenda, clientes, caja, reportes, servicios y
  precios, equipo y comisiones. En el celular la agenda es un calendario como el de Fresha o Booksy: tira de días arriba,
  una columna por barbero que se desliza de costado, la línea de la hora actual, y se toca un hueco para cargar
  un turno. Con un botón pasa a lista con los huecos libres. Las tablas pasan a tarjetas.

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

1. Copiar [`src/config/filo.ts`](src/config/filo.ts) con otro nombre y cambiar los datos: nombre, colores, sucursales,
   horarios, servicios, precios, equipo, productos, reseñas, fotos (en `public/img/<negocio>/`) y créditos.
2. Sumarlo en [`src/config/negocio.ts`](src/config/negocio.ts), crear `.env.<negocio>` con `VITE_NEGOCIO=<negocio>` y poner el título de la pestaña en [`vite.config.ts`](vite.config.ts).
3. `npm run dev -- --mode <negocio>` para verlo, y sumar un `vite build --mode <negocio> --outDir dist/<negocio>`
   al script `build` de `package.json` para publicarlo en `/<repo>/<negocio>/`.

`npm run dev` abre Filo; `npm run dev -- --mode ayrton` abre Ayrton.

## La demo de Filo

Todo es inventado: nombre, direcciones, teléfonos (555), equipo, reseñas, clientes y turnos. Las fotos son de
Wikimedia Commons con licencia libre (Nenad Stojkovic, CC BY 2.0; Classic Barbers, CC0), con el crédito al pie.

## La demo de Ayrton: qué es real y qué es de muestra

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
