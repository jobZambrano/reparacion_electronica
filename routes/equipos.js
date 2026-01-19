const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../utils/auth');

//Metodo get para registro unico
router.get('/:id', verifyToken, (req, res)=>{
    const { id } = req.params;//Capturar el id desde los parametros de la URL
    const query = 'SELECT * FROM equipos WHERE id_equ = ?;';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({error: 'Error al obtener el equipo'})
        }
        if (results.length === 0) {
            return res.status(404).json({error: 'Equipo no encontrado'})
        }
        res.json(results[0]);
    });
});

//Metodo Get para multiples registros con paginacion y busqueda 
router.get('/', verifyToken, (req, res) => {
    // obtener parámetros de la URL
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit; // el punto de inicio de la consulta
    const cadena = req.query.cadena;
    let whereClause = '';
    let queryParams = [];
    if (cadena) {
        whereClause= 'where tipo_equ like ? or marca_equ like ? or modelo_equ like ?';
        const searchTerm = `%${cadena}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm)
    }
    // consulta para obtener total de registros
    const countQuery = `SELECT COUNT(*) as total FROM equipos ${whereClause}`;
    db.query(countQuery, queryParams, (err, countResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener total de equipos' });
        }

        const totalTecnicos = countResult[0].total;
        const totalPages = Math.ceil(totalTecnicos / limit);

        // consulta para obtener los registros de la página
        const tecnicosQuery = `SELECT * FROM equipos ${whereClause} LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);
        db.query(tecnicosQuery, queryParams, (err, tecnicosResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al obtener equipos' });
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

//Metodo post
router.post('/', verifyToken, (req, res)=>{
    //Obtener los datos
    const {tipo_equ, marca_equ, modelo_equ, serie_equ, id_cli} =req.body;
    const search_query = 'select count(*) as contador from equipos where serie_equ = ?;';
    db.query(search_query, [serie_equ], (err, search_result)=>{
        if(err){
            console.error(err);
            return res.status(500).json({error: 'Error interno al verificar el equipo'});
        }
        if(search_result[0].contador > 0){
            return res.status(409).json({error: 'El equipo ya existe'});
        }
    })
    const query = 'INSERT INTO equipos values (null, ?, ?, ?, ?, ?);';
    const values = [tipo_equ, marca_equ, modelo_equ, serie_equ, id_cli];
    db.query(query, values, (err, result)=>{
        if(err){
            console.error(err);
            return res.status(500).json({error: 'Error al insertar el equipo'});
        }
        res.status(201).json({
            message: 'Equipo insertado correctamente',
            id_equ: result.insertId,
        });
    })
});

//MÉTODO PUT
router.put('/:id', verifyToken, (req, res)=>{
    const { id } = req.params;//Capturar el id desde los parametros de la URL
    const {tipo_equ, marca_equ, modelo_equ, serie_equ, id_cli} =req.body;
    const query = 'UPDATE equipos set tipo_equ = ?, marca_equ = ?, modelo_equ = ?, serie_equ = ?, id_cli = ? WHERE id_equ = ?;';
    const values = [tipo_equ, marca_equ, modelo_equ, serie_equ, id_cli, id];
    db.query(query, values, (err, result)=>{
        if(err){
            console.error(err);
            return res.status(500).json({error: 'Error al actualizar el equipo'});
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }
        res.status(201).json({
            message: 'Equipo actualizado correctamente',
        });
    });
});

//MÉTODO DELETE
router.delete('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
   const search_query = 'select count(*) as contador from detalle_orden where id_equ = ?;';
    db.query(search_query, [id], (err, search_result)=>{
        if(err){
            console.error(err);
            return res.status(500).json({error: 'Error interno al verificar el detalle de orden'});
        }
        if(search_result[0].contador > 0){
            return res.status(409).json({error: 'El equipo no se puede eliminar porque está asociado a una orden de trabajo'});
        }
        const query = 'DELETE FROM equipos WHERE id_equ = ?';
        const values = [id];
        db.query(query, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Error al eliminar equipo' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Equipo no encontrado' });
    }
    res.status(200).json({ mensaje: 'Equipo eliminado correctamente' });
    });
    })
  
});

module.exports= router;