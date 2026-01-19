const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../utils/auth');

//metodo get para registros unicos
router.get('/:id', verifyToken, (req, res) => {
    const { id } = req.params; //capturar id desde los parametros de la URL
    const query = 'SELECT * FROM CLIENTES WHERE id_cli =?;'
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: ' Error al obtener el cliente' })
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' })
        }
        res.json(results[0]);
    });
});

//Metodo Get para multiples registros con paginacion y busquedad
router.get('/', verifyToken, (req, res) => {
    //Obtener parametros de la url
    const page = parseInt(req.query.page) || 1; //pagina actual por defecto 1
    const limit = parseInt(req.query.limit) || 10;// limites de registros, por defecto 10
    const offset = (page - 1) * limit;// el punto de inicio de la consulta
    const cadena = req.query.cadena;
    let whereClause = '';
    let queryParams = [];
    if (cadena) {
        whereClause = 'where nombre_cli like ? or email_cli like ?';
        const searchTerm = `%${cadena}%`;
        queryParams.push(searchTerm, searchTerm);

    }

    //consultas para obtener total registros
    const countQuery = `select count(*) as total from clientes ${whereClause}`;
    db.query(countQuery, queryParams, (err, countResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener total de clientes' });
        }
        const totalClientes = countResult[0].total;
        const totalPages = Math.ceil(totalClientes / limit);
        //consulta par obtener los registros de la pagina 
        const clientesQuery = `select * from clientes ${whereClause} LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);
        db.query(clientesQuery, queryParams, (err, clientesResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Errror al obtener los clientes' });
            }
            //Enviar respuesta on los datos y la informacion de paginación
            res.json({
                totalItems: totalClientes,
                totalPages: totalPages,
                currentPage: page,
                limit: limit,
                data: clientesResult
            });
        });
    });
});
//Metodo POST
router.post('/', verifyToken, (req, res) => {
    //obtener los datos
    const { nombre_cli, email_cli, telefono_cli, direccion_cli } = req.body;
    const search_query = 'select count(*) as contador from clientes where email_cli = ?';
    db.query(search_query, [email_cli], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error interno al verificar el cliente' });
        }
        if (result[0].contador > 0) {
            return res.status(500).json({ error: 'El cliente con email' + email_cli + 'ya existe' })
        }
        const query = 'INSERT INTO clientes VALUES(null,?,?,?)';
        const values = [nombre_cli, email_cli, telefono_cli, direccion_cli];
        db.query(query, values, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(409).json({ error: 'Error al insertar cliente' });
            }
            res.status(201).json({
                message: 'Cliente insertado correctamente', id_cli: result.insertId
            })
        })
    })


})

//Metodo Put
router.put('/:id', verifyToken, (req, res) => {
    const { id } = req.params; //capturar id desde los parametros de la URL
    const { nombre_cli, email_cli, telefono_cli, direccion_cli} = req.body;
    const query = 'update clientes set nombre_cli = ?, email_cli = ?, telefono_cli = ?, direccion_cli = ? WHERE id_cli = ?';
    const values = [nombre_cli, email_cli, telefono_cli, direccion_cli, id];
    db.query(query, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error al actualizar cliente' });
        }
        if (result.affectedRows == 0) {
            return res.status(404).json({ message: "Cliente no encontrado" })
        }
        res.status(200).json({ message: 'Cliente actualizado correctamente' })
    })
})

//Metodo DELETE
router.delete('/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const search_query = 'select count(*) as contador from ordenes where id_cli = ? '
    db.query(search_query, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error interno al verificar la orden' });
        }
        if (result[0].contador > 0) {
            return res.status(409).json({ error: 'Cliente no se puede eliminar por que tiene una orden registrada' })
        }
        const query = 'DELETE FROM clientes WHERE id_cli = ?';
        db.query(query, [id], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Error al eliminar cliente' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: 'Cliente no encontrado' });
            }
            res.status(200).json({ mensaje: 'Cliente eliminado correctamente' });
        });
    })


});
//klk
module.exports = router;
