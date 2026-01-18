const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { generateToken } = require('../utils/auth');

router.post('/login', (req, res) => {
  const { usuario_tec, contrasenia_tec } = req.body;
  db.query('select * from tecnicos where usuario_tec =?', [usuario_tec], async (err, results) => {
    if (err) throw err;
    if (results.length == 0) {
      return res.status(401).json({ message: 'Usuario y contraseña incorrrecta' });
    }
    const user = results[0];
    const isPasswordValid = await bcrypt.compare(contrasenia_tec, user.contrasenia_tec);// usar el nobre y el campo de contrasenia
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Usuario y contraseña incorrrecta' });
    }
    //muesta el resultado
    console.log({ id: user.id_tec, usuario_tec: user.usuario_tec});
    console.log('hola');
    
    const token = generateToken({ id: user.id_tec, usuario_tec: user.usuario_tec});
    res.json({ message: 'Logueo exitoso ', token })
  });
});
module.exports = router;