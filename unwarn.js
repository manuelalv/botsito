const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'advertencias.json');

module.exports = {
    nombre: 'unwarn', // Comando para quitar advertencias
    ejecutar: async (sock, msg, args) => {
        const from = msg.key.remoteJid;

        if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Solo en grupos, babe.' }, { quoted: msg });

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const sender = msg.key.participant || msg.key.remoteJid;

        const isSenderAdmin = !!participants.find(p => p.id === sender)?.admin;

        if (!isSenderAdmin) return await sock.sendMessage(from, { text: '🚫 *Permiso Denegado:* Solo los admins pueden perdonar pecados.' }, { quoted: msg });

        const isQuoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const target = isQuoted || (mentioned && mentioned.length > 0 ? mentioned[0] : null);

        if (!target) return await sock.sendMessage(from, { text: '🦋 *Euphoria:* Etiqueta o responde al mensaje de la persona que quieres perdonar.' }, { quoted: msg });

        // Si el archivo no existe o está vacío
        if (!fs.existsSync(dbPath)) {
            return await sock.sendMessage(from, { text: '✨ Esta persona está limpia, no tiene advertencias registradas.' }, { quoted: msg });
        }

        let db = JSON.parse(fs.readFileSync(dbPath));
        let clave = `${from}-${target}`;

        // Si el usuario no tiene advertencias en este grupo
        if (!db[clave] || db[clave] <= 0) {
            return await sock.sendMessage(from, { text: '✨ Relájate, bro. Esta persona ya tiene 0 advertencias.' }, { quoted: msg });
        }

        // Le restamos 1 advertencia
        db[clave] -= 1;
        let conteo = db[clave];

        // Si llega a 0, borramos su registro para no acumular basura en el archivo
        if (db[clave] === 0) {
            delete db[clave];
        }

        fs.writeFileSync(dbPath, JSON.stringify(db));

        await sock.sendMessage(from, { 
            text: `╭━━〔 🕊️ *ＰＥＲＤÓＮ* 🕊️ 〕━━╮\n┃\n┃ 🦋 @${target.split('@')[0]}, te salvaste.\n┃ 🔮 *Strikes restantes:* [ ${conteo} / 3 ]\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`, 
            mentions: [target] 
        });
    }
}