const { Router } = require('express');

// Recibimos la instancia de ProductManager para usarla en las rutas
module.exports = (productManager) => {
    const router = Router();

    // GET /api/products - Devuelve el listado completo de productos
    router.get('/', (req, res) => {
        const products = productManager.getProducts();
        res.json(products);
    });

    // GET /api/products/:pid - Busca un producto por su ID
    router.get('/:pid', (req, res) => {
        const pid = Number(req.params.pid);
        const product = productManager.getProductById(pid);

        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(product);
    });

    // POST /api/products - Agrega un nuevo producto
    router.post('/', (req, res) => {
        const { title, description, price, thumbnail, code, stock, status, category, thumbnails } = req.body;
        const result = productManager.addProduct(title, description, price, thumbnail, code, stock, status, category, thumbnails);

        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }

        // Notificamos a todos los clientes por WebSocket sobre la actualización
        const io = req.app.get('io');
        io.emit('updateProducts', productManager.getProducts());

        res.status(201).json(result.product);
    });

    // PUT /api/products/:pid - Actualiza un producto existente
    router.put('/:pid', (req, res) => {
        const pid = Number(req.params.pid);
        const result = productManager.updateProduct(pid, req.body);

        if (!result.success) {
            return res.status(404).json({ error: result.message });
        }
        res.json(result.product);
    });

    // DELETE /api/products/:pid - Elimina un producto por ID
    router.delete('/:pid', (req, res) => {
        const pid = Number(req.params.pid);
        const result = productManager.deleteProduct(pid);

        if (!result.success) {
            return res.status(404).json({ error: result.message });
        }

        // Notificamos a todos los clientes por WebSocket sobre la actualización
        const io = req.app.get('io');
        io.emit('updateProducts', productManager.getProducts());

        res.json({ message: 'Producto eliminado' });
    });

    return router;
};
