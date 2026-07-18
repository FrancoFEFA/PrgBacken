// Router de carritos con endpoints completos usando Mongoose, populate y manejo de stock
const { Router } = require('express');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

const router = Router();

// POST /api/carts - Crea un nuevo carrito vacio
router.post('/', async (req, res) => {
    try {
        const cart = await Cart.create({ products: [] });
        res.status(201).json({ status: 'success', payload: cart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// GET /api/carts/:cid - Obtiene un carrito con sus productos completos usando populate
router.get('/:cid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid).populate('products.product').lean();

        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
        }

        res.json({ status: 'success', payload: cart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST /api/carts/:cid/product/:pid - Agrega un producto al carrito y decrementa stock
router.post('/:cid/product/:pid', async (req, res) => {
    try {
        // Validamos que el producto exista
        const product = await Product.findById(req.params.pid);
        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
        }

        // Verificamos que haya stock disponible
        if (product.stock < 1) {
            return res.status(400).json({ status: 'error', message: 'Sin stock disponible' });
        }

        const cart = await Cart.findById(req.params.cid);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
        }

        // Verificamos si el producto ya existe en el carrito
        const existingProduct = cart.products.find(
            p => p.product.toString() === req.params.pid
        );

        if (existingProduct) {
            // Si ya existe, incrementamos la cantidad en 1
            existingProduct.quantity += 1;
        } else {
            // Si no existe, lo agregamos al array
            cart.products.push({ product: req.params.pid, quantity: 1 });
        }

        // Decrementamos el stock del producto
        product.stock -= 1;
        await product.save();
        await cart.save();

        // Devolvemos el carrito actualizado con populate
        const updatedCart = await Cart.findById(req.params.cid).populate('products.product').lean();
        res.json({ status: 'success', payload: updatedCart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// DELETE /api/carts/:cid/products/:pid - Elimina un producto del carrito y restaura stock
router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
        }

        // Buscamos el producto dentro del carrito
        const productIndex = cart.products.findIndex(
            p => p.product.toString() === req.params.pid
        );

        if (productIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado en el carrito' });
        }

        // Obtenemos la cantidad antes de eliminar
        const quantityToRemove = cart.products[productIndex].quantity;

        // Eliminamos el producto del array usando splice
        cart.products.splice(productIndex, 1);

        // Restauramos el stock del producto
        await Product.findByIdAndUpdate(req.params.pid, { $inc: { stock: quantityToRemove } });

        await cart.save();

        const updatedCart = await Cart.findById(req.params.cid).populate('products.product').lean();
        res.json({ status: 'success', payload: updatedCart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// PUT /api/carts/:cid - Actualiza todos los productos del carrito y ajusta stock
router.put('/:cid', async (req, res) => {
    try {
        const { products } = req.body;

        if (!Array.isArray(products)) {
            return res.status(400).json({ status: 'error', message: 'El body debe contener un array de productos' });
        }

        const cart = await Cart.findById(req.params.cid);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
        }

        // Restauramos el stock de los productos viejos del carrito
        for (const oldItem of cart.products) {
            await Product.findByIdAndUpdate(oldItem.product, { $inc: { stock: oldItem.quantity } });
        }

        // Validamos y aplicamos stock de los productos nuevos
        for (const newItem of products) {
            const product = await Product.findById(newItem.product);
            if (!product) {
                return res.status(400).json({ status: 'error', message: `Producto ${newItem.product} no encontrado` });
            }
            if (product.stock < newItem.quantity) {
                return res.status(400).json({ status: 'error', message: `Sin stock suficiente para ${product.title}` });
            }
            await Product.findByIdAndUpdate(newItem.product, { $inc: { stock: -newItem.quantity } });
        }

        // Reemplazamos completamente el array de productos
        cart.products = products;
        await cart.save();

        const updatedCart = await Cart.findById(req.params.cid).populate('products.product').lean();
        res.json({ status: 'success', payload: updatedCart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// PUT /api/carts/:cid/products/:pid - Actualiza la cantidad de un producto y ajusta stock
router.put('/:cid/products/:pid', async (req, res) => {
    try {
        const { quantity } = req.body;

        if (quantity === undefined || typeof quantity !== 'number' || quantity < 1) {
            return res.status(400).json({ status: 'error', message: 'Se debe proporcionar una cantidad valida en el body' });
        }

        const cart = await Cart.findById(req.params.cid);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
        }

        // Buscamos el producto dentro del carrito
        const productInCart = cart.products.find(
            p => p.product.toString() === req.params.pid
        );

        if (!productInCart) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado en el carrito' });
        }

        // Calculamos la diferencia entre la nueva y vieja cantidad
        const oldQuantity = productInCart.quantity;
        const diff = quantity - oldQuantity;

        // Si se incrementa la cantidad, verificamos stock disponible
        if (diff > 0) {
            const product = await Product.findById(req.params.pid);
            if (product.stock < diff) {
                return res.status(400).json({ status: 'error', message: 'Sin stock suficiente para esa cantidad' });
            }
        }

        // Actualizamos la cantidad
        productInCart.quantity = quantity;

        // Ajustamos el stock segun la diferencia
        await Product.findByIdAndUpdate(req.params.pid, { $inc: { stock: -diff } });

        await cart.save();

        const updatedCart = await Cart.findById(req.params.cid).populate('products.product').lean();
        res.json({ status: 'success', payload: updatedCart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// DELETE /api/carts/:cid - Elimina todos los productos del carrito y restaura stock
router.delete('/:cid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
        }

        // Restauramos el stock de todos los productos del carrito
        for (const item of cart.products) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }

        // Vaciamos el array de productos
        cart.products = [];
        await cart.save();

        res.json({ status: 'success', payload: cart });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
