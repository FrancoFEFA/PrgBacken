// Router de productos con paginacion, filtros y ordenamiento usando Mongoose
const { Router } = require('express');
const Product = require('../models/product.model');

const router = Router();

// GET /api/products - Devuelve productos con paginacion, filtros y ordenamiento
// Query params: limit (default 10), page (default 1), sort (asc/desc), query (filtro)
router.get('/', async (req, res) => {
    try {
        const { limit = 10, page = 1, sort, query } = req.query;

        // Construimos el filtro de busqueda
        let filter = {};
        if (query) {
            // Si el query contiene "=", parseamos como campo=valor (ej: "category=Ropa")
            if (query.includes('=')) {
                const [field, value] = query.split('=');
                filter[field] = value;
            } else {
                // Si no, buscamos por titulo o descripcion que contengan el texto
                filter.$or = [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ];
            }
        }

        // Construimos el ordenamiento
        let sortOption = {};
        if (sort) {
            // sort=asc ordena precio de menor a mayor, sort=desc de mayor a menor
            sortOption.price = sort === 'desc' ? -1 : 1;
        }

        // Ejecutamos la consulta con paginacion usando Mongoose
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: Object.keys(sortOption).length ? sortOption : undefined,
            lean: true
        };

        const result = await Product.paginate(filter, options);

        // Construimos la respuesta con el formato solicitado
        const response = {
            status: result.docs.length ? 'success' : 'error',
            payload: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: result.hasPrevPage ? `/api/products?page=${result.prevPage}&limit=${limit}` : null,
            nextLink: result.hasNextPage ? `/api/products?page=${result.nextPage}&limit=${limit}` : null
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// GET /api/products/:pid - Busca un producto por su ID
router.get('/:pid', async (req, res) => {
    try {
        const product = await Product.findById(req.params.pid).lean();

        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
        }

        res.json({ status: 'success', payload: product });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST /api/products - Agrega un nuevo producto
router.post('/', async (req, res) => {
    try {
        const { title, description, price, thumbnail, code, stock, status, category, thumbnails } = req.body;

        // Verificamos que el codigo no este duplicado
        const existing = await Product.findOne({ code });
        if (existing) {
            return res.status(400).json({ status: 'error', message: `El codigo '${code}' ya existe` });
        }

        const product = await Product.create({
            title, description, price, thumbnail, code, stock, status, category, thumbnails
        });

        // Notificamos a todos los clientes por WebSocket sobre la actualizacion
        const io = req.app.get('io');
        const products = await Product.find().lean();
        io.emit('updateProducts', products);

        res.status(201).json({ status: 'success', payload: product });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
});

// PUT /api/products/:pid - Actualiza un producto existente
router.put('/:pid', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.pid,
            req.body,
            { new: true, runValidators: true }
        ).lean();

        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
        }

        res.json({ status: 'success', payload: product });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
});

// DELETE /api/products/:pid - Elimina un producto por ID
router.delete('/:pid', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.pid);

        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
        }

        // Notificamos a todos los clientes por WebSocket sobre la actualizacion
        const io = req.app.get('io');
        const products = await Product.find().lean();
        io.emit('updateProducts', products);

        res.json({ status: 'success', message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
