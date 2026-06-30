const { Router } = require('express');

// Recibimos las instancias de CartManager y ProductManager
module.exports = (cartManager, productManager) => {
    const router = Router();

    // POST /api/carts - Crea un nuevo carrito con ID autoincrementable
    router.post('/', (req, res) => {
        const cart = cartManager.createCart();
        res.status(201).json(cart);
    });

    // GET /api/carts/:cid - Obtiene los productos de un carrito específico
    router.get('/:cid', (req, res) => {
        const cid = Number(req.params.cid);
        const cart = cartManager.getCartById(cid);

        if (!cart) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }
        res.json(cart.products);
    });

    // POST /api/carts/:cid/product/:pid - Agrega un producto al carrito
    router.post('/:cid/product/:pid', (req, res) => {
        const cid = Number(req.params.cid);
        const pid = Number(req.params.pid);

        // Validamos que el producto exista antes de agregarlo al carrito
        const product = productManager.getProductById(pid);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const result = cartManager.addProductToCart(cid, pid);

        if (!result.success) {
            return res.status(404).json({ error: result.message });
        }
        res.json(result.cart);
    });

    return router;
};
