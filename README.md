# Backend I - Entrega Final

API REST para gestion de productos y carritos de compras con persistencia en **MongoDB (Atlas)**, paginacion, filtros, ordenamiento, manejo de stock y WebSockets en tiempo real.

## Funcionalidades

- CRUD completo de productos y carritos
- Paginacion, filtros y ordenamiento en productos
- Manejo automatico de stock (descuento al agregar, restauracion al eliminar)
- Persistencia en MongoDB Atlas (nube)
- Tiempo real con Socket.io
- Vistas dinamicas con Handlebars
- Navegacion de carrito con localStorage

## Instalacion

```bash
pnpm install
```

## Configuracion

Crear archivo `.env` en la raiz del proyecto:

```
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/nombre_base_datos
PORT=8080
```

## Iniciar

```bash
pnpm start
```

Servidor corriendo en `http://localhost:8080`.

## Endpoints API

### Productos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/products` | Listar productos con paginacion y filtros |
| `GET` | `/api/products/:pid` | Obtener producto por ID |
| `POST` | `/api/products` | Crear producto |
| `PUT` | `/api/products/:pid` | Actualizar producto |
| `DELETE` | `/api/products/:pid` | Eliminar producto |

#### Query params en GET /api/products

| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `limit` | Number | 10 | Productos por pagina |
| `page` | Number | 1 | Pagina a mostrar |
| `sort` | String | - | `asc` (menor a mayor) o `desc` (mayor a menor) por precio |
| `query` | String | - | Filtro: `category=Ropa` o texto libre para buscar en titulo/descripcion |

#### Respuesta paginada

```json
{
    "status": "success",
    "payload": [...],
    "totalPages": 5,
    "prevPage": 1,
    "nextPage": 3,
    "page": 2,
    "hasPrevPage": true,
    "hasNextPage": true,
    "prevLink": "/api/products?page=1&limit=10",
    "nextLink": "/api/products?page=3&limit=10"
}
```

### Carritos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `POST` | `/api/carts` | Crear carrito nuevo |
| `GET` | `/api/carts/:cid` | Obtener carrito con productos completos (populate) |
| `POST` | `/api/carts/:cid/product/:pid` | Agregar producto al carrito (descuenta stock) |
| `PUT` | `/api/carts/:cid/products/:pid` | Actualizar cantidad de un producto (ajusta stock) |
| `PUT` | `/api/carts/:cid` | Reemplazar todos los productos del carrito |
| `DELETE` | `/api/carts/:cid/products/:pid` | Eliminar un producto del carrito (restaura stock) |
| `DELETE` | `/api/carts/:cid` | Vaciar carrito (restaura todo el stock) |

#### Manejo de stock

- **Agregar producto**: decrementa stock en 1. Si no hay stock, devuelve error.
- **Eliminar producto**: restaura stock segun la cantidad que tenia en el carrito.
- **Actualizar cantidad**: ajusta la diferencia de stock (+ o -).
- **Reemplazar productos**: restaura stock de los viejos, valida y decrementa stock de los nuevos.
- **Vaciar carrito**: restaura el stock de todos los productos.

### Vistas (Handlebars)

| Ruta | Descripcion |
|------|-------------|
| `GET /` | Inicio con listado de productos |
| `GET /products` | Productos con paginacion, filtros y ordenamiento |
| `GET /products/:pid` | Detalle de un producto individual |
| `GET /carts` | Carrito vacio |
| `GET /carts/:cid` | Carrito con sus productos |
| `GET /realtimeproducts` | Productos en tiempo real (WebSocket) |

#### Funcionalidades de las vistas

- **Productos**: filtros por categoria/texto, ordenamiento por precio, paginacion, boton "Agregar al carrito"
- **Detalle de producto**: informacion completa, boton "Agregar al carrito"
- **Carrito**: tabla de productos con subtotales, total, opciones de eliminar y vaciar
- **Tiempo real**: agregar, editar y eliminar productos via WebSocket, agregar al carrito
- **Navegacion**: link "Mi Carrito" en el nav que lleva al carrito guardado en localStorage

## Estructura del proyecto

```
├── server.js                      # Servidor principal (Express, Socket.io, rutas de vistas)
├── .env                           # Variables de entorno (MONGO_URI, PORT)
├── src/
│   ├── config/
│   │   └── db.js                  # Conexion a MongoDB
│   ├── models/
│   │   ├── product.model.js       # Modelo de producto (Mongoose + paginacion)
│   │   └── cart.model.js          # Modelo de carrito (Mongoose con referencia a Product)
│   └── routes/
│       ├── products.router.js     # Router de productos API
│       └── carts.router.js        # Router de carritos API (con manejo de stock)
├── views/
│   ├── layouts/
│   │   └── main.handlebars        # Layout principal con nav y estilos
│   ├── home.handlebars            # Inicio con listado de productos
│   ├── products.handlebars        # Productos con paginacion y filtros
│   ├── productDetail.handlebars   # Detalle de producto individual
│   ├── cart.handlebars            # Vista de carrito
│   ├── realTimeProducts.handlebars # Productos en tiempo real
│   └── error.handlebars           # Vista de error
└── package.json
```

## Tecnologias

- **Runtime**: Node.js
- **Servidor**: Express.js
- **Base de datos**: MongoDB Atlas (Mongoose)
- **Paginacion**: mongoose-paginate-v2
- **Plantillas**: Handlebars (express-handlebars)
- **Tiempo real**: Socket.io
- **Variables de entorno**: dotenv

## Validaciones

- **Productos**: todos los campos obligatorios, precio > 0, stock >= 0, codigo unico
- **Carritos**: se valida que el producto exista y haya stock antes de agregarlo
- **Stock**: se verifica disponibilidad antes de agregar/actualizar productos en el carrito
