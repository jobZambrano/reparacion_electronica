const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Router } = require('express');

const JWT_SECRET = process.env.JWT_SECRET;


//FUNCION PARA GENERAR UN TOKEN D UN LOGEO EXITOSO
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '10h' }); // token es valido por una hora
}
// miidlewar para vereficar token en cada peticion
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Token no porpocionado' });
    }
    try {
        const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
        req.user = decoded; // agrega la informacion del ususario a la peticion 
        next(); // permite que la condision continue
    } catch (error) {
        return res.status(401).json({ message: 'Token invalido' });
    }
};
module.exports = { generateToken, verifyToken };