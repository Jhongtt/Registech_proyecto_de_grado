const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Faltan las credenciales de Supabase en el archivo .env')
}

// Inicializar el cliente usando la Service Role Key para poder subir archivos al bucket público
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Sube una imagen al bucket "equipos" de Supabase
 * @param {Buffer} buffer - El archivo en memoria
 * @param {String} filename - El nombre original del archivo o uno generado
 * @param {String} mimetype - El tipo de archivo (ej. image/png)
 * @returns {Promise<String>} - La URL pública de la imagen
 */
const subirImagenSupabase = async (buffer, filename, mimetype) => {
    try {
        const { data, error } = await supabase
            .storage
            .from('equipos')
            .upload(filename, buffer, {
                contentType: mimetype || 'image/jpeg',
                upsert: true
            })

        if (error) {
            throw error
        }

        // Obtener la URL pública
        const { data: { publicUrl } } = supabase
            .storage
            .from('equipos')
            .getPublicUrl(filename)

        return publicUrl

    } catch (error) {
        console.error('Error al subir imagen a Supabase:', error)
        throw error
    }
}

module.exports = {
    supabase,
    subirImagenSupabase
}
