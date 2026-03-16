const axios = require('axios');

module.exports = {
    nombre: 'play',
    ejecutar: async (sock, msg, args) => {
        const from = msg.key.remoteJid;
        
        if (!args.length) return await sock.sendMessage(from, { text: '🦋 *Euphoria:* Escribe el nombre de la canción, babe. Ej: *!play Feid*' }, { quoted: msg });

        const query = args.join(' ');
        await sock.sendMessage(from, { text: `⏳ *Buscando en la matrix:* _${query}_... ✨` }, { quoted: msg });

        try {
            // 1. Buscamos el video en YouTube usando la nueva API puente
            const searchRes = await axios.get(`https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`);
            
            if (!searchRes.data || !searchRes.data.data || searchRes.data.data.length === 0) {
                return await sock.sendMessage(from, { text: '❌ *Error:* No encontré nada, intenta ser más específico.' }, { quoted: msg });
            }

            const video = searchRes.data.data[0]; // Tomamos el primer resultado

            // Enviamos la miniatura para que el grupo vea qué canción encontró
            await sock.sendMessage(from, { 
                image: { url: video.thumbnail }, 
                caption: `╭━━〔 🎵 *ＭÚＳＩＣＡ* 🎵 〕━━╮\n┃\n┃ ✨ *Título:* ${video.title}\n┃ 💜 *Estado:* Extrayendo audio...\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━╯` 
            }, { quoted: msg });

            // 2. Usamos el "motor" de descarga para sacar el MP3 directamente
            const dlRes = await axios.get(`https://api.siputzx.my.id/api/d/ytmp3?url=${video.url}`);
            
            if (!dlRes.data || !dlRes.data.data || !dlRes.data.data.dl) {
                throw new Error("La API no devolvió el link de descarga");
            }

            const audioUrl = dlRes.data.data.dl;

            // 3. Enviamos el audio fresquito al grupo
            await sock.sendMessage(from, { 
                audio: { url: audioUrl }, 
                mimetype: 'audio/mpeg',
                fileName: `${video.title}.mp3`
            }, { quoted: msg });

        } catch (error) {
            console.error('Error en comando play:', error);
            await sock.sendMessage(from, { text: '❌ *Ups:* El servidor de descargas bloqueó la petición o está saturado. Intenta de nuevo en un par de minutos.' }, { quoted: msg });
        }
    }
}