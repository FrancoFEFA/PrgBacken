// Modelo de producto para MongoDB usando Mongoose
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// Esquema que define la estructura de cada documento de producto en la coleccion "products"
const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El titulo es obligatorio']
    },
    description: {
        type: String,
        required: [true, 'La descripcion es obligatoria']
    },
    price: {
        type: Number,
        required: [true, 'El precio es obligatorio'],
        min: [0, 'El precio no puede ser negativo']
    },
    thumbnail: {
        type: String,
        required: [true, 'El thumbnail es obligatorio']
    },
    code: {
        type: String,
        required: [true, 'El codigo es obligatorio'],
        unique: true
    },
    stock: {
        type: Number,
        required: [true, 'El stock es obligatorio'],
        min: [0, 'El stock no puede ser negativo']
    },
    status: {
        type: Boolean,
        default: true
    },
    category: {
        type: String,
        required: [true, 'La categoria es obligatoria']
    },
    thumbnails: {
        type: [String],
        default: []
    }
});

// Indice para busquedas por categoria
productSchema.index({ category: 1 });

// Indice para ordenamiento por precio
productSchema.index({ price: 1 });

// Plugin de paginacion
productSchema.plugin(mongoosePaginate);

// Creamos el modelo a partir del esquema y lo exportamos
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
