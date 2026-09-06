const { z } = require('zod')

const crearPrestamoSchema = z.object({
    body: z.object({

        // Varios equipos
        num_series: z.array(
            z.string()
                .min(1)
                .max(50)
        ).min(1, 'Debe seleccionar al menos un equipo'),

        // Empleado seleccionado
        id_empleado: z.string()
            .uuid('El id del empleado debe ser un UUID válido')
            .optional()
            .nullable(),

        // Usuario del sistema seleccionado
        id_usuario: z.number()
            .int()
            .positive()
            .optional()
            .nullable(),

        observaciones: z.string()
            .max(500)
            .optional()
            .nullable(),

        fecha_inicio: z.string()
            .regex(
                /^\d{4}-\d{2}-\d{2}$/,
                'La fecha debe tener formato YYYY-MM-DD'
            )
            .optional()
            .nullable(),

        fecha_limite: z.string()
            .regex(
                /^\d{4}-\d{2}-\d{2}$/,
                'La fecha debe tener formato YYYY-MM-DD'
            )
            .optional()
            .nullable()
    }).refine(
        data => data.id_empleado || data.id_usuario,
        {
            message: 'Debe seleccionar un empleado o un usuario',
            path: ['id_empleado']
        }
    )
})

const devolverPrestamoSchema = z.object({

    params: z.object({

        id: z.string()
            .min(1)
            .max(50)

    })

})

const historialEquipoSchema = z.object({

    params: z.object({

        num_serie: z.string()
            .min(1)
            .max(50)

    })

})

module.exports = {
    crearPrestamoSchema,
    devolverPrestamoSchema,
    historialEquipoSchema
}