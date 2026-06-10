const express = require('express');
const ProductManager = require('./ProductManager');
const CartManager = require('./CartManager');

const app = express();
const PORT = 8080;

// Middleware para parsear JSON en las peticiones
app.use(express.json());

// Instancias de los managers
const productManager = new ProductManager();
const cartManager = new CartManager();

// ==================== RUTAS DE PRODUCTOS ====================

// GET /api/products/ - Listar todos los productos
app.get('/api/products', (req, res) => {
    const products = productManager.getProducts();
    res.json(products);
});

// GET /api/products/:pid - Obtener un producto por ID
app.get('/api/products/:pid', (req, res) => {
    const pid = Number(req.params.pid);
    const product = productManager.getProductById(pid);

    if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(product);
});

// POST /api/products/ - Agregar un nuevo producto
app.post('/api/products', (req, res) => {
    const result = productManager.addProduct(req.body);

    if (!result.success) {
        return res.status(400).json({ error: result.message });
    }
    res.status(201).json(result.product);
});

// PUT /api/products/:pid - Actualizar un producto por ID
app.put('/api/products/:pid', (req, res) => {
    const pid = Number(req.params.pid);
    const result = productManager.updateProduct(pid, req.body);

    if (!result.success) {
        return res.status(404).json({ error: result.message });
    }
    res.json(result.product);
});

// DELETE /api/products/:pid - Eliminar un producto por ID
app.delete('/api/products/:pid', (req, res) => {
    const pid = Number(req.params.pid);
    const result = productManager.deleteProduct(pid);

    if (!result.success) {
        return res.status(404).json({ error: result.message });
    }
    res.json({ message: 'Producto eliminado' });
});

// ==================== RUTAS DE CARRITOS ====================

// POST /api/carts/ - Crear un nuevo carrito
app.post('/api/carts', (req, res) => {
    const cart = cartManager.createCart();
    res.status(201).json(cart);
});

// GET /api/carts/:cid - Listar productos de un carrito por ID
app.get('/api/carts/:cid', (req, res) => {
    const cid = Number(req.params.cid);
    const cart = cartManager.getCartById(cid);

    if (!cart) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    res.json(cart.products);
});

// POST /api/carts/:cid/product/:pid - Agregar producto al carrito
app.post('/api/carts/:cid/product/:pid', (req, res) => {
    const cid = Number(req.params.cid);
    const pid = Number(req.params.pid);
    const result = cartManager.addProductToCart(cid, pid);

    if (!result.success) {
        return res.status(404).json({ error: result.message });
    }
    res.json(result.cart);
});

// ==================== INICIO DEL SERVIDOR ====================

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});