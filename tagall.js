module.exports = {
    nombre: 'tagall',
    ejecutar: async (sock, msg, args) => {
        const from = msg.key.remoteJid;

        // 1. Verificamos que el comando se esté ejecutando en un grupo
        if (!from.endsWith('@g.us')) {
            return await sock.sendMessage(from, { text: '❌ *Error:* Este comando solo puede usarse en grupos, babe.' }, { quoted: msg });
        }

        // 2. Obtenemos la información del grupo
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        
        // Obtenemos el ID de la persona que envió el comando
        const sender = msg.key.participant || msg.key.remoteJid;

        // 3. Verificamos si la persona que lo envió es administrador
        const isSenderAdmin = participants.find(p => p.id === sender)?.admin !== null && participants.find(p => p.id === sender)?.admin !== undefined;

        if (!isSenderAdmin) {
            return await sock.sendMessage(from, { text: '🚫 *Permiso Denegado:* Solo los administradores del grupo pueden invocar a todos.' }, { quoted: msg });
        }

        // 4. Preparamos el mensaje personalizado (si el admin no escribió nada, ponemos un texto por defecto)
        const textoPersonalizado = args.length > 0 ? args.join(' ') : 'activense ';

        // 5. Armamos la lista de menciones con el estilo Euphoria
        let textoMenciones = `╭━━〔 ✨ *L L A M A D O  G E N E R A L* ✨ 〕━━╮\n┃\n┃ 🗣️ *Aviso:* ${textoPersonalizado}\n┃\n`;
        let jids = []; // Aquí guardaremos los IDs reales para que WhatsApp los marque de azul

        for (let participante of participants) {
            // Extraemos el número de teléfono sin el @s.whatsapp.net
            const numero = participante.id.split('@')[0];
            textoMenciones += `┣ 🦋 @${numero}\n`;
            jids.push(participante.id);
        }

        textoMenciones += `╰━━━━━━━━━━━━━━━━━━━━━━━╯`;

        // 6. Enviamos el mensaje con la matriz de menciones (mentions) para que les llegue la notificación a todos
        await sock.sendMessage(from, {
            text: textoMenciones,
            mentions: jids // ¡Esta es la magia que hace que vibren sus celulares!
        }, { quoted: msg });
    }
}