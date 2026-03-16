module.exports = {
    nombre: 'ping', // Este es el nombre del comando (!ping)
    ejecutar: async (sock, msg, args) => {
        const from = msg.key.remoteJid;
        await sock.sendMessage(from, { text: '¡Pong! 🏓 El sistema modular está funcionando al 100%, bro.' }, { quoted: msg });
    }
}