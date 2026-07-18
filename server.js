// Servidor principal con Express, MongoDB, Socket.io y Handlebars
require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { engine } = require('express-handlebars');
const connectDB = require('./src/config/db');
const productsRouter = require('./src/routes/products.router');
const cartsRouter = require('./src/routes/carts.router');
const Product = require('./src/models/product.model');
const Cart = require('./src/models/cart.model');

const app = express();
const PORT = process.env.PORT || 8080;

// Conexion a MongoDB antes de levantar el servidor
connectDB();

// Creamos el servidor HTTP nativo sobre Express para poder adjuntarle Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer);

// Middleware para parsear JSON en las peticiones
app.use(express.json());

// Configuracion de Handlebars como motor de plantillas
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// Guardamos la instancia de io en app para accederla desde las rutas HTTP
app.set('io', io);

// Montamos los routers de API
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// RUTAS DE VISTAS

// GET / - Vista de inicio con la lista completa de productos
app.get('/', async (req, res) => {
    try {
        const products = await Product.find().lean();
        res.render('home', { products });
    } catch (error) {
        res.status(500).render('error', { message: error.message });
    }
});

// GET /products - Vista de productos con paginacion usando Mongoose
app.get('/products', async (req, res) => {
    try {
        const { limit = 10, page = 1, sort, query } = req.query;

        // Construimos el filtro de busqueda
        let filter = {};
        if (query) {
            if (query.includes('=')) {
                const [field, value] = query.split('=');
                filter[field] = value;
            } else {
                filter.$or = [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ];
            }
        }

        // Construimos el ordenamiento
        let sortOption = {};
        if (sort) {
            sortOption.price = sort === 'desc' ? -1 : 1;
        }

        // Ejecutamos la consulta con paginacion
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: Object.keys(sortOption).length ? sortOption : undefined,
            lean: true
        };

        const result = await Product.paginate(filter, options);

        res.render('products', {
            products: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            limit: parseInt(limit),
            sort: sort || '',
            query: query || '',
            sortAsc: sort === 'asc',
            sortDesc: sort === 'desc'
        });
    } catch (error) {
        res.status(500).render('error', { message: error.message });
    }
});

// GET /products/:pid - Vista de detalle de un producto individual
app.get('/products/:pid', async (req, res) => {
    try {
        const product = await Product.findById(req.params.pid).lean();

        if (!product) {
            return res.status(404).render('error', { message: 'Producto no encontrado' });
        }

        res.render('productDetail', { product });
    } catch (error) {
        res.status(500).render('error', { message: error.message });
    }
});

// GET /carts - Vista de carrito vacio (cuando no hay cartId seleccionado)
app.get('/carts', (req, res) => {
    res.render('cart', { cartId: null, products: [], total: 0 });
});

// GET /carts/:cid - Vista de un carrito especifico con sus productos
app.get('/carts/:cid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid).populate('products.product').lean();

        if (!cart) {
            return res.status(404).render('error', { message: 'Carrito no encontrado' });
        }

        // Calculamos el subtotal de cada producto y el total del carrito
        const products = cart.products.map(item => ({
            ...item,
            subtotal: item.product.price * item.quantity
        }));

        const total = products.reduce((sum, item) => sum + item.subtotal, 0);

        res.render('cart', {
            cartId: cart._id,
            products,
            total
        });
    } catch (error) {
        res.status(500).render('error', { message: error.message });
    }
});

// GET /realtimeproducts - Vista con WebSocket que se actualiza en tiempo real
app.get('/realtimeproducts', async (req, res) => {
    try {
        const products = await Product.find().lean();
        res.render('realTimeProducts', { products });
    } catch (error) {
        res.status(500).render('error', { message: error.message });
    }
});

// WEBSOCKET

// Manejamos conexiones entrantes de Socket.io
io.on('connection', (socket) => {
    console.log('Cliente conectado por WebSocket');

    // Al conectarse, enviamos la lista actual de productos al cliente
    Product.find().lean().then(products => {
        socket.emit('updateProducts', products);
    });

    // El cliente envia un nuevo producto desde el formulario de la vista en tiempo real
    socket.on('addProduct', async (data) => {
        try {
            await Product.create(data);
            const products = await Product.find().lean();
            io.emit('updateProducts', products);
        } catch (error) {
            console.error('Error al agregar producto:', error.message);
        }
    });

    // El cliente solicita eliminar un producto desde la vista en tiempo real
    socket.on('deleteProduct', async (productId) => {
        try {
            await Product.findByIdAndDelete(productId);
            const products = await Product.find().lean();
            io.emit('updateProducts', products);
        } catch (error) {
            console.error('Error al eliminar producto:', error.message);
        }
    });

    // El cliente solicita editar un producto desde la vista en tiempo real
    socket.on('editProduct', async (data) => {
        try {
            const { id, product } = data;
            await Product.findByIdAndUpdate(id, product);
            const products = await Product.find().lean();
            io.emit('updateProducts', products);
        } catch (error) {
            console.error('Error al editar producto:', error.message);
        }
    });
});

// INICIO DEL SERVIDOR

// Usamos httpServer.listen en lugar de app.listen para que Socket.io funcione
httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
