const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const fs = require('fs');
const path = require('path');

// 🔥 EL TRUCO MÁGICO PARA EL ESPACIO 🔥
// Creamos una carpeta 'temp' en tu espacio principal de 2.2 GB
const tempFolder = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder);
}
// Le obligamos al sistema a usar esta carpeta grande en lugar de la pequeña (/tmp)
process.env.TMPDIR = tempFolder;

module.exports = {
    nombre: 's',
    ejecutar: async (sock, msg, args) => {
        const from = msg.key.remoteJid;
        const senderName = msg.pushName || 'babe';

        const isQuoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const mensajeReal = isQuoted ? isQuoted : msg.message;
        
        const imageMsg = mensajeReal?.imageMessage;
        const videoMsg = mensajeReal?.videoMessage;

        if (!imageMsg && !videoMsg) {
            return await sock.sendMessage(from, { text: '🦋 *Euphoria:* Envíame una foto o video corto (máx 10s) con el comando *!s* o responde a uno.' }, { quoted: msg });
        }

        if (videoMsg && videoMsg.seconds > 10) {
            return await sock.sendMessage(from, { text: '⚠️ *Oops:* El video es muy largo. Máximo 10 segundos para los stickers animados, babe.' }, { quoted: msg });
        }

        await sock.sendMessage(from, { text: '✨ *Creando tu sticker...* ⏳' }, { quoted: msg });

        try {
            const tipo = imageMsg ? 'image' : 'video';
            const media = imageMsg || videoMsg;
            const stream = await downloadContentFromMessage(media, tipo);
            
            let buffer = Buffer.from([]);
            for await(const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const sticker = new Sticker(buffer, {
                pack: '✨ Euphoria Bot',
                author: senderName,
                type: StickerTypes.FULL,
                quality: videoMsg ? 30 : 60, // Le bajamos un pelín la calidad al video para que cargue más rápido
                background: 'transparent'
            });

            const stickerBuffer = await sticker.toBuffer();
            await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });

        } catch (error) {
            console.error('Error al crear sticker:', error);
            await sock.sendMessage(from, { text: '❌ *Error:* Ups, la magia falló. El video sigue siendo muy pesado o tiene un formato raro.' }, { quoted: msg });
        }
    }
}