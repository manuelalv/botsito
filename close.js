module.exports = {
    nombre: 'close',
    ejecutar: async (sock, msg, args) => {
        const from = msg.key.remoteJid;

        if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Solo en grupos, babe.' }, { quoted: msg });

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const sender = msg.key.participant || msg.key.remoteJid;

        const isSenderAdmin = participants.find(p => p.id === sender)?.admin;
        if (!isSenderAdmin) return await sock.sendMessage(from, { text: '🚫 *Permiso Denegado:* Solo los admins controlan las puertas.' }, { quoted: msg });

        try {
            await sock.groupSettingUpdate(from, 'announcement');
            await sock.sendMessage(from, { text: '🔒 *Grupo Cerrado:* Solo los admins pueden hablar ahora. _Silencio en la sala._ ✨' }, { quoted: msg });
        } catch (error) {
            console.error(error);
            await sock.sendMessage(from, { text: '❌ *Error:* No pude cerrar el grupo. Verifica que yo sea admin.' }, { quoted: msg });
        }
    }
}