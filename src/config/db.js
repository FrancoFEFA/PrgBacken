// Configuracion de conexion a MongoDB usando Mongoose
const mongoose = require('mongoose');

// Funcion que conecta a la base de datos usando la URI del archivo .env
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB conectado exitosamente');
    } catch (error) {
        console.error('Error al conectar con MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
