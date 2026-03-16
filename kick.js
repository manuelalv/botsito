module.exports = {
    nombre: 'kick',
    ejecutar: async (sock, msg, args) => {
        const from = msg.key.remoteJid;

        if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Solo en grupos, babe.' }, { quoted: msg });

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const sender = msg.key.participant || msg.key.remoteJid;

        // 1. Verificamos que el usuario (TÚ) sea administrador
        const isSenderAdmin = participants.find(p => p.id === sender)?.admin;
        if (!isSenderAdmin) return await sock.sendMessage(from, { text: '🚫 *Permiso Denegado:* Solo la realeza (admins) puede usar esto.' }, { quoted: msg });

        // 2. Identificamos a quién vamos a eliminar
        const isQuoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const target = isQuoted || (mentioned && mentioned.length > 0 ? mentioned[0] : null);

        if (!target) return await sock.sendMessage(from, { text: '🦋 *Euphoria:* Etiqueta o responde al mensaje de la persona que quieres eliminar.' }, { quoted: msg });

        // 3. ¡Disparamos la expulsión directamente sin preguntar por el ID del bot!
        try {
            await sock.groupParticipantsUpdate(from, [target], 'remove');
            
            await sock.sendMessage(from, { 
                text: `╭━━〔 ⚔️ *ＥＸＩＬＩＯ* ⚔️ 〕━━╮\n┃\n┃ 🦋 @${target.split('@')[0]} ha sido eliminado.\n┃ _You should see me in a crown._ 👑\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`, 
                mentions: [target] 
            });

        } catch (error) {
            console.error('Error al expulsar:', error);
            // Si WhatsApp rechaza la orden, es porque le falta el admin o intentas sacar al creador
            await sock.sendMessage(from, { text: '👑 *Error:* WhatsApp no me dejó expulsarlo. Asegúrate de que tengo el rango de Administrador y que no estás intentando sacar al creador del grupo.' }, { quoted: msg });
        }
    }
}