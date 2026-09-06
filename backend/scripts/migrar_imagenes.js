const prisma = require('../lib/prisma');
const { subirImagenSupabase } = require('../config/supabase');
const axios = require('axios');
const cheerio = require('cheerio');

async function searchBingImages(query) {
    try {
        const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        const images = [];
        $('a.iusc').each((i, el) => {
            const m = $(el).attr('m');
            if (m) {
                const metadata = JSON.parse(m);
                images.push(metadata.murl); // main url
            }
        });
        return images[0] || null; // Devolver la primera imagen
    } catch (e) {
        console.error(`❌ Error buscando imagen en Bing para "${query}":`, e.message);
        return null;
    }
}

async function downloadImageBuffer(imageUrl) {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        return {
            buffer: Buffer.from(response.data),
            mimetype: response.headers['content-type'] || 'image/jpeg'
        };
    } catch (e) {
        console.error(`❌ Error descargando imagen desde ${imageUrl}:`, e.message);
        return null;
    }
}

async function migrarImagenes() {
    console.log('🚀 Iniciando script de migración automática de imágenes...');
    
    try {
        // 1. Obtener todos los equipos sin imagen
        const equipos = await prisma.equipos.findMany({
            where: {
                imagen: null
            }
        });

        console.log(`📦 Encontrados ${equipos.length} equipos sin imagen.`);

        // 2. Procesar cada equipo
        let exitosos = 0;
        let fallidos = 0;

        for (const equipo of equipos) {
            console.log(`\n🔍 Buscando: ${equipo.equipo} (Serie: ${equipo.num_serie})`);
            
            // Si el nombre del equipo es basura (ej. "ghjkl" o "PC Test"), intentamos buscarlo pero puede fallar
            const query = equipo.equipo;
            const imageUrl = await searchBingImages(query);

            if (!imageUrl) {
                console.log(`⚠️ No se encontró ninguna imagen en internet para "${query}".`);
                fallidos++;
                continue;
            }

            console.log(`🔗 Imagen encontrada: ${imageUrl.substring(0, 50)}... Descargando...`);
            
            const fileData = await downloadImageBuffer(imageUrl);
            if (!fileData) {
                fallidos++;
                continue;
            }

            // Generar nombre de archivo
            const extension = imageUrl.split('.').pop().split('?')[0] || 'jpg';
            const filename = `equipo-${equipo.num_serie}-${Date.now()}.${extension}`;

            console.log(`☁️ Subiendo a Supabase como ${filename}...`);
            try {
                const supabaseUrl = await subirImagenSupabase(fileData.buffer, filename, fileData.mimetype);
                
                // Guardar URL en la base de datos
                await prisma.equipos.update({
                    where: { num_serie: equipo.num_serie },
                    data: { imagen: supabaseUrl }
                });

                console.log(`✅ ¡Éxito! Imagen guardada para ${equipo.equipo}`);
                exitosos++;
            } catch (error) {
                console.error(`❌ Error subiendo a Supabase:`, error.message);
                fallidos++;
            }

            // Pequeña pausa para no saturar Bing ni Supabase
            await new Promise(res => setTimeout(res, 500));
        }

        console.log('\n=======================================');
        console.log(`🎉 Proceso terminado.
✔️ Exitosos: ${exitosos}
❌ Fallidos: ${fallidos}`);
        console.log('=======================================');

    } catch (error) {
        console.error('❌ Error general en el script:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrarImagenes();
