const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');

const comandos = new Map();

function cargarComandos(directorio) {
    const archivos = fs.readdirSync(directorio);
    for (const archivo of archivos) {
        const rutaCompleta = path.join(directorio, archivo);
        if (fs.statSync(rutaCompleta).isDirectory()) {
            cargarComandos(rutaCompleta); 
        } else if (archivo.endsWith('.js')) {
            const comando = require('./' + rutaCompleta);
            comandos.set(comando.nombre, comando);
            console.log(`✅ Comando cargado: ${comando.nombre}`);
        }
    }
}

async function iniciarBot() {
    console.log('Cargando sistema modular...');
    
    if (!fs.existsSync('./comandos')) {
        fs.mkdirSync('./comandos');
        console.log('Carpeta "comandos" creada. Agrega tus carpetas ahí dentro.');
    }
    
    cargarComandos('./comandos');

    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    
    // FIX: Obtenemos la versión más reciente de WhatsApp para evitar el error 405
    const { version } = await fetchLatestBaileysVersion();
    console.log(`Usando versión de WhatsApp: v${version.join('.')}`);

    const sock = makeWASocket({
        version, // Usamos la versión oficial que acabamos de descargar
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"] // Simulamos ser un navegador normal
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n==================================================');
            console.log('¡Escanea el siguiente código QR con tu WhatsApp!');
            console.log('==================================================\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const motivo = lastDisconnect?.error?.output?.statusCode;
            console.log(`\n❌ Desconectado. Motivo/Código de error: ${motivo}`);

            if (motivo === 401 || motivo === 405) {
                console.log('⚠️ LA SESIÓN O VERSIÓN ES INVÁLIDA.');
                console.log('👉 Ve al File Manager, BORRA la carpeta "auth_info_baileys" y vuelve a darle Start.');
            } else {
                console.log('⏳ Reconectando en 3 segundos...\n');
                setTimeout(iniciarBot, 3000);
            }
        } else if (connection === 'open') {
            console.log('¡Botsito conectado y listo para moderar!');
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        
        if (!text.startsWith('!')) return; 

        const args = text.slice(1).trim().split(/ +/);
        const nombreComando = args.shift().toLowerCase();

        const comandoExe = comandos.get(nombreComando);

        if (comandoExe) {
            try {
                await comandoExe.ejecutar(sock, msg, args);
            } catch (error) {
                console.error(`Error al ejecutar el comando ${nombreComando}:`, error);
            }
        }
    });
}

iniciarBot();