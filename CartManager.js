const fs = require('fs');

class CartManager {
    // Ruta del archivo donde se persisten los carritos
    static filePath = './carts.json';

    constructor() {
        // Carga los carritos desde el archivo o inicializa vacío
        this.carts = this._loadCarts();
    }

    // Lee el archivo JSON y devuelve el arreglo de carritos
    _loadCarts() {
        try {
            if (fs.existsSync(CartManager.filePath)) {
                const data = fs.readFileSync(CartManager.filePath, 'utf-8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error al cargar carritos:', error.message);
        }
        return [];
    }

    // Guarda el arreglo de carritos en el archivo JSON
    _saveCarts() {
        try {
            fs.writeFileSync(CartManager.filePath, JSON.stringify(this.carts, null, 2));
        } catch (error) {
            console.error('Error al guardar carritos:', error.message);
        }
    }

    // Devuelve el siguiente ID disponible
    _getNextId() {
        if (this.carts.length === 0) return 1;
        const maxId = Math.max(...this.carts.map(c => c.id));
        return maxId + 1;
    }

    // Crea un nuevo carrito con products vacío
    createCart() {
        const cart = {
            id: this._getNextId(),
            products: []
        };
        this.carts.push(cart);
        this._saveCarts();
        return cart;
    }

    // Busca un carrito por su ID
    getCartById(id) {
        return this.carts.find(cart => cart.id === id) || null;
    }

    // Agrega un producto al carrito o incrementa quantity si ya existe
    addProductToCart(cartId, productId) {
        const cart = this.getCartById(cartId);
        if (!cart) {
            return { success: false, message: 'Carrito no encontrado' };
        }

        // Verificar si el producto ya está en el carrito
        const existingProduct = cart.products.find(p => p.product === productId);
        if (existingProduct) {
            // Incrementar quantity si ya existe
            existingProduct.quantity += 1;
        } else {
            // Agregar nuevo producto con quantity 1
            cart.products.push({ product: productId, quantity: 1 });
        }

        this._saveCarts();
        return { success: true, cart };
    }
}

module.exports = CartManager;