const fs = require('fs');

class ProductManager {
    // Ruta del archivo donde se persisten los productos
    static filePath = './products.json';

    constructor() {
        // Carga los productos desde el archivo o inicializa vacío
        this.products = this._loadProducts();
    }

    _loadProducts() {
        try {
            if (fs.existsSync(ProductManager.filePath)) {
                const data = fs.readFileSync(ProductManager.filePath, 'utf-8');
                return JSON.parse(data);
            }
        } catch {
            console.error('Error al cargar productos');
        }
        return [];
    }

    _saveProducts() {
        fs.writeFileSync(ProductManager.filePath, JSON.stringify(this.products, null, 2));
    }

    addProduct(title, description, price, thumbnail, code, stock, status, category, thumbnails) {
        const required = [title, description, price, thumbnail, code, stock, status, category, thumbnails];
        if (required.some(v => v == null || v === '')) {
            return { success: false, message: 'Todos los campos son obligatorios' };
        }

        if (this.products.some(p => p.code === code)) {
            return { success: false, message: `El código '${code}' ya existe` };
        }

        const id = this.products.length ? Math.max(...this.products.map(p => p.id)) + 1 : 1;
        const product = {
            id,
            title,
            description,
            price,
            thumbnail,
            code,
            status,
            stock,
            category,
            thumbnails
        };

        this.products.push(product);
        this._saveProducts();
        return { success: true, product };
    }

    getProducts() {
        return this.products;
    }

    getProductById(id) {
        return this.products.find(p => p.id === id) || null;
    }

    updateProduct(id, updates) {
        const index = this.products.findIndex(p => p.id === id);
        if (index === -1) return { success: false, message: 'Not found' };

        delete updates.id;
        this.products[index] = { ...this.products[index], ...updates };
        this._saveProducts();
        return { success: true, product: this.products[index] };
    }

    deleteProduct(id) {
        const index = this.products.findIndex(p => p.id === id);
        if (index === -1) return { success: false, message: 'Not found' };

        this.products.splice(index, 1);
        this._saveProducts();
        return { success: true };
    }
}

module.exports = ProductManager;