const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//importar rutas
const authRoutes = require('./routes/auth');
const tecnicosRoutes = require('./routes/tecnicos');
const serviciosRoutes = require('./routes/servicios');
const clientesRoutes = require('./routes/clientes');
const equiposRoutes = require('./routes/equipos');

// usar las rutas
app.use('/api/auth', authRoutes);
app.use('/api/tecnicos', tecnicosRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/equipos', equiposRoutes);
//ruta de ejemplo
app.get('/', (req, res) => {
    res.send('Hola desde el servidor express');
});

// inicar el servidor

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);

});
