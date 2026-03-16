module.exports = {
    nombre: 'demote',
    ejecutar: async (sock, msg, args) => {
        const from = msg.key.remoteJid;

        if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Solo en grupos, babe.' }, { quoted: msg });

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const sender = msg.key.participant || msg.key.remoteJid;

        const isSenderAdmin = participants.find(p => p.id === sender)?.admin;
        if (!isSenderAdmin) return await sock.sendMessage(from, { text: '🚫 *Permiso Denegado:* Solo la realeza puede quitar coronas.' }, { quoted: msg });

        const isQuoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const target = isQuoted || (mentioned && mentioned.length > 0 ? mentioned[0] : null);

        if (!target) return await sock.sendMessage(from, { text: '🦋 *Euphoria:* Etiqueta o responde al mensaje de quien vas a degradar.' }, { quoted: msg });

        try {
            await sock.groupParticipantsUpdate(from, [target], 'demote');
            await sock.sendMessage(from, { 
                text: `╭━━〔 📉 *D E G R A D A D O* 📉 〕━━╮\n┃\n┃ 🥀 @${target.split('@')[0]} vuelve a ser mortal.\n┃ _El poder es una ilusión._ 🌌\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`, 
                mentions: [target] 
            });
        } catch (error) {
            console.error(error);
            await sock.sendMessage(from, { text: '❌ *Error:* No pude quitarle el admin. Quizás es el creador del grupo.' }, { quoted: msg });
        }
    }
}