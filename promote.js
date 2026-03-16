module.exports = {
    nombre: 'promote',
    ejecutar: async (sock, msg, args) => {
        const from = msg.key.remoteJid;

        if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Solo en grupos, babe.' }, { quoted: msg });

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const sender = msg.key.participant || msg.key.remoteJid;

        const isSenderAdmin = participants.find(p => p.id === sender)?.admin;
        if (!isSenderAdmin) return await sock.sendMessage(from, { text: '🚫 *Permiso Denegado:* Solo la realeza puede otorgar coronas.' }, { quoted: msg });

        const isQuoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const target = isQuoted || (mentioned && mentioned.length > 0 ? mentioned[0] : null);

        if (!target) return await sock.sendMessage(from, { text: '🦋 *Euphoria:* Etiqueta o responde al mensaje de quien vas a ascender.' }, { quoted: msg });

        try {
            await sock.groupParticipantsUpdate(from, [target], 'promote');
            await sock.sendMessage(from, { 
                text: `╭━━〔 👑 *A S C E N S O* 👑 〕━━╮\n┃\n┃ ✨ @${target.split('@')[0]} ahora es Administrador.\n┃ _Bienvenido a la mesa redonda._ 🥂\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`, 
                mentions: [target] 
            });
        } catch (error) {
            console.error(error);
            await sock.sendMessage(from, { text: '❌ *Error:* WhatsApp no me dejó hacerlo. Verifica que yo sea admin.' }, { quoted: msg });
        }
    }
}