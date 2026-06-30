# PrgBacken I

API REST para gestión de productos y carritos de compras con persistencia JSON y WebSockets en tiempo real.

## Instalación

Con Node.js instalado ejecutar:

```bash
pnpm install
```

## Iniciar

```bash
node server.js
```

Servidor corriendo en `http://localhost:8080`.

## Endpoints

### Productos

- `GET` `/api/products` — Listar todos los productos
- `GET` `/api/products/:pid` — Obtener producto por ID
- `POST` `/api/products` — Crear un producto (valida campos obligatorios, precio > 0, stock >= 0 y código único)
- `PUT` `/api/products/:pid` — Actualizar producto por ID
- `DELETE` `/api/products/:pid` — Eliminar producto por ID

### Carritos

- `POST` `/api/carts` — Crear un carrito nuevo
- `GET` `/api/carts/:cid` — Ver productos de un carrito
- `POST` `/api/carts/:cid/product/:pid` — Agregar producto al carrito (valida que el producto exista)

### Vistas

- `GET` `/` — Home con listado de productos
- `GET` `/realtimeproducts` — Vista en tiempo real con WebSocket

## Validaciones

- **Productos**: todos los campos son obligatorios, `price` debe ser número > 0, `stock` número >= 0, `code` debe ser único
- **Carritos**: se valida que el producto exista antes de agregarlo al carrito; si ya existe en el carrito se incrementa su `quantity`

## Estructura

```
├── server.js                  # Servidor Express, WebSocket y montaje de routers
├── ProductManager.js          # CRUD de productos con persistencia JSON
├── CartManager.js             # Gestión de carritos con persistencia JSON
├── src/
│   └── routes/
│       ├── products.router.js # Rutas de productos con express.Router
│       └── carts.router.js    # Rutas de carritos con express.Router
├── views/                     # Plantillas Handlebars
├── products.json              # Persistencia de productos
└── carts.json                 # Persistencia de carritos
```
