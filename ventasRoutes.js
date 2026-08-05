const express = require('express')
const router = express.Router()
const db = require('./conexion')

//RUTA PARA OBTENER LAS VENTAS EN UN RANGO DE FECHAS
router.get('/ventas', (req, res) => {
    const { inicio, fin } = req.query

    if(!inicio || !fin) {
        return res.status(400).send('Las fechas son obligatorias')
    }
    
    const fechaInicio = new Date(inicio)
    const fechaFin = new Date(fin)

//VALIDAMOS QUE LAS FECHAS SEAN CORRECTAS

if(isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
    return res.status(400).send('Las fechas proporcionadas no son validas')
}

//ASEGURAMOS QUE LA FECHA INICIO NO SEA MAYOR A FECHA FINAL
if(fechaInicio > fechaFin) {
    return res.status(400).send('La fecha de inicio no puede ser mayor a la fecha final')
}

//FORMATEAMOS LAS FECHAS YYYY-MM-DD PARA LA CONSULTA SQL
const fechaInicioStr = fechaInicio.toISOString().split('T')[0]
const fechaFinStr = fechaFin.toISOString().split('T')[0]
const query = `SELECT * FROM ventas WHERE fecha_venta BETWEEN ? AND ?`

db.query(query, [fechaInicioStr, fechaFinStr], (error, results) => {
    if(error) {
        console.error(error)
        return res.status(500).send('Error al obtener las ventas')
    }

    res.json(results)
    
})

})

//RUTA PARA AGREGAR REGISTRO DE VENTAS
//CODIGO-PRODUCTO-PRE_PUBLICO-CANTIDAD-TOTAL_TOTALVENTA_USUARIO
router.post('/ventas', (req, res) => {
    const { venta } = req.body

    if(!venta) {
        return res.status(400).send('No se recibio la venta')
    }

    const fecha = new Date()

//FORMATEAR FECHA EN YYYY-MM-DD
const anio = fecha.getFullYear()
const mes = String(fecha.getMonth() + 1).padStart(2, '0')
const dia = String(fecha.getDate()).padStart(2, '0')

const id_venta = Date.now().toString()

//CREAR EL STRING EN EL FORMATO DESEADO
const fecha_venta = `${anio}-${mes}-${dia}`

//SEPARAR LOS PRODUCTOS Y EL TOTAL DE LA VENTA(ASUMIENDI QUE VENTA VIENE COMO UN STRING 'PRODUCTOS_TOTALES')
const productosString = venta.split('_')
const productos = productosString[0]

const total_venta = parseFloat(productosString[1])
const vendedor = productosString[2]
 
//VALIDAR EL TOTAL DE LA VENTA
if(isNaN(total_venta)) {
    return res.status(400).send('El total de la venta no es el valido')
}

//INSERTAR LA VENTA EN LA BASE DE DATOS
const query = `INSERT INTO ventas (id_venta, productos, total_venta, fecha_venta, vendedor) VALUES (?, ?, ?, ?, ?)`
db.query(query, [id_venta, productos, total_venta, fecha_venta, vendedor], (error, results) => {
    if(error) {
        console.error(error)
        return res.status(500).send('Error al insertar la venta')
    }

    res.status(201).send({
        mensaje: 'Venta registrada con exito',
        id_venta
    })
})

})

module.exports = router