const fs = require('fs');

class ProductManager {
    // Ruta del archivo donde se persisten los productos
    static filePath = './products.json';

    // Constructor: Carga los productos desde el archivo JSON o inicializa un arreglo vacío
    constructor() {
        this.products = this._loadProducts();
    }

    // Método privado: Lee el archivo de productos y lo parsea como JSON
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

    // Método privado: Guarda el arreglo de productos en el archivo JSON con formato legible
    _saveProducts() {
        fs.writeFileSync(ProductManager.filePath, JSON.stringify(this.products, null, 2));
    }

    // Agrega un nuevo producto validando campos obligatorios y código único
    // Parámetros: title, description, price, thumbnail, code, stock, status, category, thumbnails
    addProduct(title, description, price, thumbnail, code, stock, status, category, thumbnails) {
        // Validación: Verifica que todos los campos estén presentes y no estén vacíos
        const required = [title, description, price, thumbnail, code, stock, status, category, thumbnails];
        if (required.some(v => v == null || v === '')) {
            return { success: false, message: 'Todos los campos son obligatorios' };
        }

        // Validación: Verifica que el código no se repita en la base de datos
        if (this.products.some(p => p.code === code)) {
            return { success: false, message: `El código '${code}' ya existe` };
        }

        // Generación del ID: Toma el máximo ID existente + 1, o 1 si no hay productos
        const id = this.products.length ? Math.max(...this.products.map(p => p.id)) + 1 : 1;

        // Creación del producto con todos los campos
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

        // Agrega el producto al arreglo y persiste los cambios
        this.products.push(product);
        this._saveProducts();
        return { success: true, product };
    }

    // Devuelve el arreglo completo de productos
    getProducts() {
        return this.products;
    }

    // Busca un producto por su ID y lo devuelve, o null si no existe
    getProductById(id) {
        return this.products.find(p => p.id === id) || null;
    }

    // Actualiza un producto por ID, permitiendo modificación de campos excepto el ID
    updateProduct(id, updates) {
        const index = this.products.findIndex(p => p.id === id);
        if (index === -1) return { success: false, message: 'Not found' };

        // Previene la actualización del ID
        delete updates.id;

        // Combina el producto existente con los campos actualizados
        this.products[index] = { ...this.products[index], ...updates };
        this._saveProducts();
        return { success: true, product: this.products[index] };
    }

    // Elimina un producto por ID
    deleteProduct(id) {
        const index = this.products.findIndex(p => p.id === id);
        if (index === -1) return { success: false, message: 'Not found' };

        // Remueve el producto del arreglo y persiste los cambios
        this.products.splice(index, 1);
        this._saveProducts();
        return { success: true };
    }
}

module.exports = ProductManager;