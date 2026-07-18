// Modelo de carrito para MongoDB usando Mongoose
const mongoose = require('mongoose');

// Esquema que define la estructura de cada documento de carrito en la coleccion "carts"
const cartSchema = new mongoose.Schema({
    products: {
        type: [{
            // Cada producto dentro del carrito referencia al modelo Product
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: [1, 'La cantidad minima es 1'],
                default: 1
            }
        }],
        default: []
    }
});

// Creamos el modelo a partir del esquema y lo exportamos
const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
