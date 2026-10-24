# DANEL · Sublimación creativa

Web del equipo DANEL para explorar diseños y preparar consultas de productos personalizados.

**Web pública:** https://danel-creativa.web.app

## Contenido
- Portada, colecciones, proceso, estudio, detalle de diseño y contacto en páginas independientes.
- Logo oficial DANEL y paleta azul.
- Tazas: 11 oz, 6 oz, negras de 11 oz y mágicas.
- Franelas: vinil o DTF textil; modelo de corte clásico, oversize o suéter; selección de talla.
- Cinco categorías: Tu Idea, Navidad, Cumpleaños, Evento y Festividad.
- Galería existente con diseño plano y ejemplo aplicado al producto, mediante puntero o toque.
- Las opciones elegidas se conservan hasta la consulta por correo.

Las vistas aplicadas de la galería son ejemplos de presentación; no se generan automáticamente nuevas imágenes para cada combinación. La disponibilidad y la adaptación al modelo elegido se confirman con el equipo DANEL. El formulario prepara un correo; el cliente decide enviarlo desde su aplicación.

## Selección paso a paso
1. Al abrir Colecciones solo aparecen las pestañas grandes de Tazas y Franelas, con sus iconos.
2. Al elegir un producto se muestran sus modelos. Todavía no aparecen los diseños.
3. Al elegir un modelo se abre la galería existente, con sus cinco categorías y la vista aplicada de cada diseño. En franelas también se pueden indicar técnica y talla.
4. Cambiar de Tazas a Franelas, o al contrario, vuelve al paso de elegir modelo. Los enlaces desde el detalle conservan la selección para volver a la galería.

## Previsualizar en tu computadora
Descarga o clona este repositorio y abre `public/index.html` con Chrome o Edge. Para ver directamente las colecciones, abre `public/colecciones.html`. No necesitas instalar dependencias ni ejecutar un proceso de compilación.

También puedes probar Firebase Hosting localmente desde la raíz del proyecto:

```sh
npx -y firebase-tools@latest emulators:start --only hosting --project danel-creativa
```

La consola indicará la dirección local para abrir la previsualización.

## Organización

| Ruta | Contenido |
| --- | --- |
| `public/` | Archivos que se publican en Firebase Hosting |
| `public/assets/` | Logo, animación, diseños y fotografías |
| `public/assets/opciones/` | Miniaturas de los tipos de producto |
| `public/opciones.js` | Modelos, técnicas, tallas y selección de producto |
| `public/catalogo.js` | Catálogo de diseños |
| `public/app.js` | Navegación, galería y formulario de consulta |
| `tests/` | Pruebas de selección y preparación del correo |
| `content/` | Registro de los prompts de las miniaturas generadas |
| `firebase.json` | Configuración de Firebase Hosting |

## Comprobar el formulario
Con Node.js instalado, ejecuta:

```sh
npm test
```

Las pruebas no envían mensajes ni abren una aplicación de correo.

## Publicar en la misma web
Guardar cambios en GitHub no publica automáticamente el sitio. No hay un flujo de despliegue automático configurado.

Desde esta carpeta, inicia sesión en Firebase con la cuenta que tiene acceso al proyecto, si hace falta:

```sh
npx -y firebase-tools@latest login
```

Después de revisar la previsualización, publica:

```sh
npx -y firebase-tools@latest deploy --only hosting --project danel-creativa
```

Espera el mensaje `Deploy complete`. La dirección se mantiene en https://danel-creativa.web.app.

Las claves, tokens y archivos de cuentas de servicio no deben añadirse al repositorio. `.firebaserc` contiene únicamente el identificador público del proyecto.
