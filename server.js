const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { engine } = require('express-handlebars');
const ProductManager = require('./ProductManager');
const CartManager = require('./CartManager');
const productsRouter = require('./src/routes/products.router');
const cartsRouter = require('./src/routes/carts.router');

const app = express();
const PORT = 8080;

// Creamos el servidor HTTP nativo sobre Express para poder adjuntarle Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer);

// Middleware para parsear JSON en las peticiones
app.use(express.json());

// Configuración de Handlebars como motor de plantillas
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// Guardamos la instancia de io en app para accederla desde las rutas HTTP
app.set('io', io);

// Instancias de los managers
const productManager = new ProductManager();
const cartManager = new CartManager();

// Montamos los routers de API con sus respectivos managers
app.use('/api/products', productsRouter(productManager));
app.use('/api/carts', cartsRouter(cartManager, productManager));

// RUTAS DE VISTAS

// GET / - Vista home con la lista de productos (renderizado estático del servidor)
app.get('/', (req, res) => {
    const products = productManager.getProducts();
    res.render('home', { products });
});

// GET /realtimeproducts - Vista con WebSocket que se actualiza en tiempo real
app.get('/realtimeproducts', (req, res) => {
    const products = productManager.getProducts();
    res.render('realTimeProducts', { products });
});

// WEBSOCKET

// Manejamos conexiones entrantes de Socket.io
io.on('connection', (socket) => {
    console.log('Cliente conectado por WebSocket');

    // Al conectarse, enviamos la lista actual de productos al cliente
    socket.emit('updateProducts', productManager.getProducts());

    // El cliente envía un nuevo producto desde el formulario de la vista en tiempo real
    socket.on('addProduct', (data) => {
        const { title, description, price, thumbnail, code, stock, status, category, thumbnails } = data;
        const result = productManager.addProduct(title, description, price, thumbnail, code, stock, status, category, thumbnails);

        // Si se agregó correctamente, notificamos a TODOS los clientes (incluye al que envió)
        if (result.success) {
            io.emit('updateProducts', productManager.getProducts());
        }
    });

    // El cliente solicita eliminar un producto desde la vista en tiempo real
    socket.on('deleteProduct', (productId) => {
        const result = productManager.deleteProduct(Number(productId));

        // Si se eliminó correctamente, notificamos a todos los clientes
        if (result.success) {
            io.emit('updateProducts', productManager.getProducts());
        }
    });
});

// INICIO DEL SERVIDOR

// Usamos httpServer.listen en lugar de app.listen para que Socket.io funcione
httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
