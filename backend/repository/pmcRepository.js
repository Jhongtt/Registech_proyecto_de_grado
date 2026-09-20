
const { prisma } = require('../lib/prisma')

class PMCRepository {

    // =========================================================
    // OBTENER TODOS LOS PRODUCTOS
    // =========================================================

    async getAll() {

        return await prisma.productos_menor_cuantia.findMany({
            orderBy: {
                creado_en: 'desc'
            }
        })
    }


    // =========================================================
    // OBTENER PRODUCTO POR ID
    // =========================================================

    async getById(id) {

        return await prisma.productos_menor_cuantia.findUnique({
            where: {
                id
            }
        })
    }


    // =========================================================
    // CREAR PRODUCTO
    // =========================================================

    async create(data) {

        const {
            nombre,
            descripcion,
            cantidad_total
        } = data

        return await prisma.productos_menor_cuantia.create({
            data: {
                nombre,
                descripcion: descripcion || null,
                cantidad_total,
                cantidad_disponible: cantidad_total
            }
        })
    }


    // =========================================================
    // ACTUALIZAR PRODUCTO
    // =========================================================

    async update(id, data) {

        const {
            nombre,
            descripcion,
            cantidad_total,
            cantidad_disponible
        } = data

        return await prisma.productos_menor_cuantia.update({
            where: {
                id
            },

            data: {
                nombre,
                descripcion: descripcion || null,
                cantidad_total,
                cantidad_disponible
            }
        })
    }


    // =========================================================
    // ELIMINAR PRODUCTO
    // =========================================================

    async delete(id) {

        await prisma.productos_menor_cuantia.delete({
            where: {
                id
            }
        })

        return true
    }


    // =========================================================
    // ACTUALIZAR STOCK
    // =========================================================

    async updateStock(id, newStock) {

        return await prisma.productos_menor_cuantia.update({
            where: {
                id
            },

            data: {
                cantidad_disponible: newStock
            }
        })
    }


    // =========================================================
    // REGISTRAR ENTREGA DE PMC
    // =========================================================

    async registrarEntrega(idProducto, data) {

        return await prisma.$transaction(async (tx) => {

            const {
                cantidad,
                id_empleado,
                id_usuario,
                area,
                fecha_entrega,
                observaciones
            } = data


            // ==================================================
            // OBTENER PRODUCTO
            // ==================================================

            const producto = await tx.productos_menor_cuantia.findUnique({
                where: {
                    id: idProducto
                }
            })


            if (!producto) {
                throw new Error('Producto PMC no encontrado')
            }


            // ==================================================
            // VALIDAR STOCK
            // ==================================================

            const stockDisponible = producto.cantidad_disponible ?? 0

            if (stockDisponible < cantidad) {

                throw new Error(
                    `Stock insuficiente. Disponible: ${stockDisponible}`
                )
            }


            // ==================================================
            // VALIDAR DESTINATARIO
            // ==================================================

            if (!id_empleado && !id_usuario) {

                throw new Error(
                    'Debe seleccionar un empleado o un usuario'
                )
            }


            if (id_empleado && id_usuario) {

                throw new Error(
                    'La entrega solo puede tener un destinatario'
                )
            }


            // ==================================================
            // VALIDAR ÁREA
            // ==================================================

            if (!area || !area.trim()) {

                throw new Error(
                    'El área del destinatario es obligatoria'
                )
            }


            // ==================================================
            // DESCONTAR STOCK
            // ==================================================

            const nuevoStock =
                stockDisponible - cantidad


            const productoActualizado =
                await tx.productos_menor_cuantia.update({

                    where: {
                        id: idProducto
                    },

                    data: {
                        cantidad_disponible: nuevoStock
                    }
                })


            // ==================================================
            // REGISTRAR ENTREGA
            // ==================================================

            const entrega =
                await tx.entregas_menor_cuantia.create({

                    data: {

                        id_producto: idProducto,

                        cantidad,

                        id_empleado:
                            id_empleado || null,

                        id_usuario:
                            id_usuario || null,

                        area: area.trim(),

                        fecha_entrega:
                            fecha_entrega
                                ? new Date(fecha_entrega)
                                : undefined,

                        observaciones:
                            observaciones?.trim() || null
                    }
                })


            // ==================================================
            // DEVOLVER RESULTADO
            // ==================================================

            return {
                producto: productoActualizado,
                entrega
            }
        })
    }


    // =========================================================
    // OBTENER HISTORIAL DE ENTREGAS DE UN EMPLEADO
    // =========================================================

    async getEntregasPorEmpleado(idEmpleado) {

        const entregas =
            await prisma.entregas_menor_cuantia.findMany({

                where: {
                    id_empleado: idEmpleado
                },

                include: {
                    producto: true
                },

                orderBy: {
                    fecha_entrega: 'desc'
                }
            })


        return entregas.map(entrega => ({

            id_entrega: entrega.id_entrega,

            id_producto: entrega.id_producto,

            producto:
                entrega.producto?.nombre || null,

            descripcion:
                entrega.producto?.descripcion || null,

            cantidad: entrega.cantidad,

            area: entrega.area,

            fecha_entrega:
                entrega.fecha_entrega,

            observaciones:
                entrega.observaciones
        }))
    }


    // =========================================================
    // OBTENER HISTORIAL DE ENTREGAS DE UN USUARIO
    // =========================================================

    async getEntregasPorUsuario(idUsuario) {

        const entregas =
            await prisma.entregas_menor_cuantia.findMany({

                where: {
                    id_usuario: idUsuario
                },

                include: {
                    producto: true
                },

                orderBy: {
                    fecha_entrega: 'desc'
                }
            })


        return entregas.map(entrega => ({

            id_entrega: entrega.id_entrega,

            id_producto: entrega.id_producto,

            producto:
                entrega.producto?.nombre || null,

            descripcion:
                entrega.producto?.descripcion || null,

            cantidad: entrega.cantidad,

            area: entrega.area,

            fecha_entrega:
                entrega.fecha_entrega,

            observaciones:
                entrega.observaciones
        }))
    }


    // =========================================================
    // HISTORIAL GENERAL DE ENTREGAS PMC
    // =========================================================

    async getTodasLasEntregas() {

        const entregas =
            await prisma.entregas_menor_cuantia.findMany({

                include: {

                    producto: true,

                    empleado: {
                        select: {
                            nombre: true
                        }
                    },

                    usuario: {
                        select: {
                            nombre: true,
                            usuario: true
                        }
                    }
                },

                orderBy: {
                    fecha_entrega: 'desc'
                }
            })


        return entregas.map(entrega => ({

            id_entrega:
                entrega.id_entrega,

            id_producto:
                entrega.id_producto,

            producto:
                entrega.producto?.nombre || null,

            cantidad:
                entrega.cantidad,

            area:
                entrega.area,

            fecha_entrega:
                entrega.fecha_entrega,

            observaciones:
                entrega.observaciones,

            id_empleado:
                entrega.id_empleado,

            empleado:
                entrega.empleado?.nombre || null,

            id_usuario:
                entrega.id_usuario,

            usuario:
                entrega.usuario?.nombre || null,

            nombre_usuario:
                entrega.usuario?.usuario || null
        }))
    }
}


module.exports = new PMCRepository()

