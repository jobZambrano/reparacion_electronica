const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../utils/auth');
const bcrypt = require('bcrypt');

// metodo get para registro unico
router.get('/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM TECNICOS WHERE id_tec =?;';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'error al obtener el tecnico' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'tecnico no encontrado' });
        }
        res.json(results[0]);
    });
});

//metodo get
router.get('/', verifyToken, (req, res) => {
    // obtener parámetros de la URL
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit; // el punto de inicio de la consulta
    const cadena = req.query.cadena;
    let whereClause = '';
    let queryParams = [];
    if (cadena) {
        whereClause = 'where usuario_tec like ? or nombre_tec like ? or especialidad_tec like ? ';
        const searchTerm = `%${cadena}%`
        queryParams.push(searchTerm, searchTerm, searchTerm)
    }

    // consulta para obtener total de registros
    const countQuery = `SELECT COUNT(*) as total FROM tecnicos ${whereClause}`;
    db.query(countQuery, queryParams, (err, countResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener total de técnicos.' });
        }

        const totalTecnicos = countResult[0].total;
        const totalPages = Math.ceil(totalTecnicos / limit);

        // consulta para obtener los registros de la página
        const tecnicosQuery = `SELECT * FROM tecnicos ${whereClause} LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);
        db.query(tecnicosQuery, queryParams, (err, tecnicosResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al obtener técnicos' });
            }

            // enviar respuesta con los datos y paginación
            res.json({
                totalItems: totalTecnicos,
                totalPages: totalPages,
                currentPage: page,
                limit: limit,
                data: tecnicosResult
            });
        });
    });
});
//metodo post
router.post('/', verifyToken, async (req, res) => {
    //obtener los datos
    const { usuario_tec, nombre_tec, especialidad_tec, telefono_tec, contrasenia_tec } = req.body;
    const search_query = 'select count(*) as contador from tecnicos where 	usuario_tec= ?';
    db.query(search_query, [usuario_tec], async (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error interno al verificar el tecnico" })
        }
        if (result[0].contador > 0) {
            return res.status(409).json({ error: "El usuario :" + usuario_tec + " ya exixte" })
        }
        const query = 'insert into tecnicos values(null, ?, ?, ?, ?, ?)';
        try {
            const claveHasheada = await bcrypt.hash(contrasenia_tec, 12);
            const values = [usuario_tec, nombre_tec, especialidad_tec, telefono_tec, claveHasheada];
            db.query(query, values, (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: 'Error al insetar cliente' });
                }
                res.status(201).json({
                    message: 'Tecnico insertado correctamente',
                    id_tec: result.insertId
                })
            });
        } catch (error) {
            return res.status(500).json({ error: 'Error al insetar cliente' });
        }
    })


})
//METODO PUT
router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { usuario_tec, nombre_tec, especialidad_tec, telefono_tec } = req.body;
    const query = 'update tecnicos set usuario_tec = ? , nombre_tec = ?, especialidad_tec = ? , telefono_tec = ? where id_tec = ?;';
    const values = [usuario_tec, nombre_tec, especialidad_tec, telefono_tec, id];
    db.query(query, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error al actualizar cliente' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tecnico no encontrado' })

        }
        res.status(201).json({
            message: 'Tecnico actualizado correctamente',
            id_tec: id
        })
    })


})
//metodo delete
router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const search_query = 'select count(*) as contador from ordenes where id_tec =?;';
    db.query(search_query, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error interno al verificar tecnicos' });
        }
        if (result[0].contador > 0) {
            return res.status(409).json({ message: 'La orden no se puede eliminar esta asociada con tecnicos' })

        }
        const query = 'DELETE FROM tecnicos WHERE  id_tec = ?;';
        const values = [id];
        db.query(query, values, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Error al eliminar cliente' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Tecnico no encontrado' })

            }
            res.status(200).json({
                message: 'Tecnico eliminado correctamente',
                id_tec: id
            })
        })
    });
});

module.exports = router;  