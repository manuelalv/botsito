const fs = require('fs');
const path = require('path');

// Archivo donde guardaremos el conteo de advertencias
const dbPath = path.join(process.cwd(), 'advertencias.json');
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));

module.exports = {
    nombre: 'warn', // Si prefieres usar !warm, cambia esto a 'warm'
    ejecutar: async (sock, msg, args) => {
        const from = msg.key.remoteJid;

        if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Solo en grupos, babe.' }, { quoted: msg });

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const sender = msg.key.participant || msg.key.remoteJid;
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        const isSenderAdmin = !!participants.find(p => p.id === sender)?.admin;
        const isBotAdmin = !!participants.find(p => p.id === botId)?.admin;

        if (!isSenderAdmin) return await sock.sendMessage(from, { text: '🚫 *Permiso Denegado:* Solo los admins pueden dar advertencias.' }, { quoted: msg });
        
        const isQuoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const target = isQuoted || (mentioned && mentioned.length > 0 ? mentioned[0] : null);

        if (!target) return await sock.sendMessage(from, { text: '🦋 *Euphoria:* Etiqueta o responde al mensaje de quien se está portando mal.' }, { quoted: msg });
        
        // Evitar que adviertan al bot o a otros admins
        const isTargetAdmin = !!participants.find(p => p.id === target)?.admin;
        if (isTargetAdmin || target === botId) return await sock.sendMessage(from, { text: '✨ Los admins somos intocables, tontín.' }, { quoted: msg });

        // Leemos la base de datos de advertencias
        let db = JSON.parse(fs.readFileSync(dbPath));
        let clave = `${from}-${target}`; // Identificador único por grupo y usuario

        if (!db[clave]) db[clave] = 0;
        db[clave] += 1; // Sumamos 1 advertencia

        let conteo = db[clave];
        fs.writeFileSync(dbPath, JSON.stringify(db));

        if (conteo >= 3) {
            // Llegó a 3: Lo eliminamos y borramos su historial de advertencias
            if (!isBotAdmin) return await sock.sendMessage(from, { text: '👑 *Error:* Llegó a sus 3 advertencias, pero no soy admin para expulsarlo.' }, { quoted: msg });
            
            try {
                await sock.groupParticipantsUpdate(from, [target], 'remove');
                delete db[clave];
                fs.writeFileSync(dbPath, JSON.stringify(db));
                
                await sock.sendMessage(from, { 
                    text: `╭━━〔 🚨 *ＧＡＭＥ  ＯＶＥＲ* 🚨 〕━━╮\n┃\n┃ 🦋 @${target.split('@')[0]} juntó 3 advertencias.\n┃ _Fue un placer conocerte..._ 🌌✨\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`, 
                    mentions: [target] 
                });
            } catch (error) {
                await sock.sendMessage(from, { text: '❌ *Error al expulsar.*' }, { quoted: msg });
            }
        } else {
            // Solo advertimos (1 o 2)
            await sock.sendMessage(from, { 
                text: `╭━━〔 ⚠️ *ＡＤＶＥＲＴＥＮＣＩＡ* ⚠️ 〕━━╮\n┃\n┃ 🗣️ @${target.split('@')[0]}, compórtate.\n┃ 🔮 *Strike:* [ ${conteo} / 3 ]\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`, 
                mentions: [target] 
            });
        }
    }
}