module.exports = {
    nombre: 'menu',
    ejecutar: async (sock, msg, args) => {
        const from = msg.key.remoteJid;
        
        // Obtenemos el nombre de la persona que mandó el mensaje
        const senderName = msg.pushName || 'babe';

        // Diseñamos el menú con estilo Euphoria
        const menuTexto = `╭──〔 🏰 *E U P H O R I A   B O T* 🏰 〕──╮
|
| 🌑 *Hola, ${senderName}* 🌑
| _Bienvenido a la nueva era._
|
├──〔 👑 *M O D E R A C I Ó N* 〕──┤
| 🔮 *!kick*
| 🔮 *!warn*
| 🔮 *!tagall*
| 🔮 *!unwarn*
├──〔 🌌 *D I V E R S I Ó N* 〕──┤
| 🌟 *!s*
| 🌟 *!ping* (Comprueba si estoy vivo)
| 🌟 *!play*
|
╰─────────────────────────────╯

_"You should see me in a crown."_ 👑✨`;

        // Enviamos el mensaje respondiendo al original
        await sock.sendMessage(from, { text: menuTexto }, { quoted: msg });
    }
}