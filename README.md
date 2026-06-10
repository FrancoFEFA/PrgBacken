# PrgBacken I

API REST para gestión de productos y carritos de compras, construida para la primera entrega

## Instalación

Ya con Node.js instalado puedes ejecutar 
```bash
pnpm install
```

## Iniciar

```bash
node server.js
```

El servidor queda corriendo en `http://localhost:8080`.

## Endpoints

### Productos

### Productos

- `GET` `/api/products` Listar todos los productos
- `GET` `/api/products/:pid` Obtener producto por ID
- `POST` `/api/products` Crear un producto
- `PUT` `/api/products/:pid` Actualizar producto por ID
- `DELETE` `/api/products/:pid` Eliminar producto por ID

### Carritos

- `POST` `/api/carts` Crear un carrito nuevo
- `GET` `/api/carts/:cid` Ver productos de un carrito
- `POST` `/api/carts/:cid/product/:pid` Agregar producto al carrito

## Estructura

```
├── server.js          # Servidor Express y rutas
├── ProductManager.js  # CRUD de productos
├── CartManager.js     # Gestión de carritos
├── products.json      # Persistencia de productos
└── carts.json         # Persistencia de carritos
```
