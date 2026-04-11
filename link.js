module.exports = {
    nombre: 'link',
    ejecutar: async (sock, msg, args) => {
        const from = msg.key.remoteJid;

        if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Solo en grupos, babe.' }, { quoted: msg });

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        
        // Verificamos si el bot es admin para poder sacar el link
        const botNumber = sock.user.id.split(':')[0];
        const isBotAdmin = participants.find(p => p.id.includes(botNumber))?.admin;

        if (!isBotAdmin) return await sock.sendMessage(from, { text: '👑 *Error:* Necesito ser admin para sacar el enlace mágico del grupo.' }, { quoted: msg });

        try {
            // Obtenemos el código de invitación directamente de WhatsApp
            const code = await sock.groupInviteCode(from);
            const link = `https://chat.whatsapp.com/${code}`;
            
            await sock.sendMessage(from, { 
                text: `╭━━〔 🔗 *E N L A C E* 🔗 〕━━╮\n┃\n┃ ✨ *Grupo:* ${groupMetadata.subject}\n┃ 🌐 *Link:* ${link}\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━╯` 
            }, { quoted: msg });
            
        } catch (error) {
            console.error(error);
            await sock.sendMessage(from, { text: '❌ *Error:* Ocurrió un problema al intentar generar el enlace.' }, { quoted: msg });
        }
    }
}
