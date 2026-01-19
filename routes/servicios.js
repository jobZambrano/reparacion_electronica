
const express = require('express')
const router = express.Router()
const db = require('../db')
const { verifyToken } = require('../utils/auth')
//metodo get para registro unico 
router.get('/:id', verifyToken, (req, res) => {
    const { id } = req.params//calcular el id desde los parametros de la url 
    const query = 'SELECT * FROM servicios WHERE id_serv = ?;'
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'error al obtener al servicio' })
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'servicio no encontrado ' })
        }
        res.json(results[0])
    })
});




// metododo get para multiples registros con paginacion 
router.get('/', verifyToken, (req, res) => {
    // obtener parametro de la url 
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;// el punto de inicio de la consulta 
    const cadena = req.query.cadena
    let whereClause = ''
    let queryParams = []
    if (cadena) {
        whereClause = "where tipo_serv like ? or descripcion_serv like ?"
        const searchTerm = `%${cadena}%`
        queryParams.push(searchTerm, searchTerm)
    }
    // consultas para obtener total registros 
    const countQuery = `select count(*) as total from servicios ${whereClause}`;
    queryParams.push(limit, offset)
    db.query(countQuery, queryParams, (err, countResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'error al obtener total de servicios' })
        }
        const totalServicios = countResult[0].total
        const totalpages = Math.ceil(totalServicios / limit);
        // consulta para obtener los registro de las paginas 
        const serviciosQuery = `select * from servicios ${whereClause} LIMIT ? OFFSET ?`
        db.query(serviciosQuery, queryParams, (err, serviciosResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'error al obtener los servicios' })
            }
            // enviar respuesta con los datos y la informacion de paginacion
            res.json({
                totalItems: totalServicios,
                totalPage: totalpages,
                currentPage: page,
                limit: limit,
                data: serviciosResult
            })
        });

    });
});

//Metodo post
router.post('/', verifyToken, (req, res) => {
    //Obtener los datos
    const { tipo_serv, descripcion_serv, costo_serv } = req.body;
    const search_query = 'SELECT count(*) as contador from servicios where tipo_serv= ?  '
    db.query(search_query, [tipo_serv], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'error  al intentar  verificar cliente' });
        }
        if (result[0].contador > 0) {
            return res.status(409).json({ error: 'tipo de servicio' + tipo_serv + ' ya existe' });
        }
        const query = 'INSERT INTO servicios values (null, ?, ?, ?);';
        const values = [tipo_serv, descripcion_serv, costo_serv];
        db.query(query, values, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al insertar el servicio' });
            }
            res.status(201).json({
                message: 'servicio insertado correctamente',
                id_serv: result.insertId,
            });
        })
    })

})
//metodo PUT 
router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params
    const { tipo_serv, descripcion_serv, costo_serv } = req.body;
    const query = 'UPDATE servicios set tipo_serv=?, descripcion_serv=?, costo_serv=? where id_serv=?';
    const values = [tipo_serv, descripcion_serv, costo_serv, id];
    db.query(query, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al modificar el servicio' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'servicio no encontrado' });
        }
        res.status(201).json({
            message: 'servicio modificado correctamente',
            id_serv: id
        });
    })
})
/*router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params
    const query = 'delete from servicios where id_serv=?';
    const values = [id]
     db.query(query, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(200).json({ error: 'Error al eliminar servicios' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'servicio no encontrado' });
        }
        res.status(201).json({
            message: 'servicio eliminado correctamente',
            id_serv: id
        });
    
    })

})*/
//Metodo DELETE
router.delete('/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const search_query = 'SELECT count(*) as contador from detalle_orden where id_serv = ? '
    db.query(search_query, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error interno' });
        }
        if (result[0].contador> 0) {
            return res.status(409).json({ mensaje: 'El quipo nose puede eliminar porque tiene un detalle de orden', id_serv: id});
        }
        const query = 'DELETE FROM servicios WHERE id_serv = ?';
        const values = [id]
        db.query(query, values, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(200).json({ error: 'Error al eliminar servicios' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'servicio no encontrado' });
            }
            res.status(201).json({
                message: 'servicio eliminado correctamente',
                id_serv: id
            });
        })
    });

});
/*router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const values = [id];
 
    // PASO 1: Eliminar las referencias en detalle_orden (los "hijos")
    const deleteDetailsQuery = 'DELETE FROM detalle_orden WHERE id_serv = ?';
    db.query(deleteDetailsQuery, values, (err) => {
        if (err) {
            console.error("Error al eliminar detalles de orden:", err);
            return res.status(500).json({ error: 'Error al eliminar las referencias del servicio' });
        }
 
        // PASO 2: Si los hijos se eliminaron, eliminar el servicio (el "padre")
        const deleteServiceQuery = 'DELETE FROM servicios WHERE id_serv = ?';
        db.query(deleteServiceQuery, values, (err, result) => {
            if (err) {
                console.error("Error al eliminar servicio:", err);
                return res.status(500).json({ error: 'Error al eliminar servicios' });
            }
 
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'servicio no encontrado' });
            }
 
            // Éxito:
            return res.status(200).json({ // Usar 200 OK
                message: 'servicio eliminado correctamente',
                id_serv: id
            });
        });
    });
});*/
module.exports = router;