const fs = require('fs');

class CartManager {
    // Ruta del archivo donde se persisten los carritos
    static filePath = './carts.json';

    // Constructor: Carga los carritos desde el archivo JSON o inicializa un arreglo vacío
    constructor() {
        this.carts = this._loadCarts();
    }

    // Método privado: Lee el archivo de carritos y lo parsea como JSON
    _loadCarts() {
        try {
            if (fs.existsSync(CartManager.filePath)) {
                const data = fs.readFileSync(CartManager.filePath, 'utf-8');
                return JSON.parse(data);
            }
        } catch {
            console.error('Error al cargar carritos');
        }
        return [];
    }

    // Método privado: Guarda el arreglo de carritos en el archivo JSON con formato legible
    _saveCarts() {
        fs.writeFileSync(CartManager.filePath, JSON.stringify(this.carts, null, 2));
    }

    // Devuelve el siguiente ID disponible (el mayor ID existente + 1)
    _getNextId() {
        if (this.carts.length === 0) return 1;
        const maxId = Math.max(...this.carts.map(c => c.id));
        return maxId + 1;
    }

    // Crea un nuevo carrito con un ID autoincrementable y un arreglo products vacío
    createCart() {
        const cart = {
            id: this._getNextId(),
            products: []
        };
        this.carts.push(cart);
        this._saveCarts();
        return cart;
    }

    // Busca un carrito por su ID y lo devuelve, o null si no existe
    getCartById(id) {
        return this.carts.find(cart => cart.id === id) || null;
    }

    // Agrega un producto a un carrito específico
    // Si el producto ya existe, incrementa su quantity en 1
    // Si es nuevo, agrega el producto con quantity 1
    addProductToCart(cartId, productId) {
        const cart = this.getCartById(cartId);
        if (!cart) {
            return { success: false, message: 'Carrito no encontrado' };
        }

        // Busca si el producto ya está presente en el carrito
        const existingProduct = cart.products.find(p => p.product === productId);
        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cart.products.push({ product: productId, quantity: 1 });
        }

        this._saveCarts();
        return { success: true, cart };
    }
}

module.exports = CartManager;