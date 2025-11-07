const express = require('express');
const path = require('path');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CONFIGURAÇÕES PIX - EDITE COM SEUS DADOS!
const MINHA_CHAVE_PIX = '12345678900'; // Seu CPF, celular ou email PIX
const MEU_NOME = 'SEU NOME COMPLETO';
const MINHA_CIDADE = 'SUA CIDADE';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ SERVIR ARQUIVOS ESTÁTICOS CORRETAMENTE
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// ✅ ROTAS PRINCIPAIS
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

app.get('/obrigado', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'obrigado.html'));
});

app.get('/produto', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'produto.html'));
});

// ✅ API PARA GERAR PIX
app.post('/api/gerar-pix', async (req, res) => {
    try {
        console.log('📨 Recebendo solicitação PIX...');
        const { nome, cpf, email } = req.body;

        if (!nome || !cpf || !email) {
            return res.status(400).json({
                success: false,
                error: 'Todos os campos são obrigatórios'
            });
        }

        const valor = 749900; // R$ 7.499,00
        const identificador = `IPHONE${Date.now()}`;

        // Gerar payload PIX
        const payloadPIX = gerarPayloadPIX({
            chave: MINHA_CHAVE_PIX,
            valor: valor,
            nome: MEU_NOME,
            cidade: MINHA_CIDADE,
            identificador: identificador
        });

        console.log('🎯 Gerando QR Code...');

        // Gerar QR Code
        const qrCodeBase64 = await QRCode.toDataURL(payloadPIX, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Responder com sucesso
        res.json({
            success: true,
            pix: {
                valor: (valor / 100).toFixed(2),
                qrCode: payloadPIX,
                qrCodeImage: qrCodeBase64,
                identificador: identificador
            },
            cliente: {
                nome: nome,
                email: email
            }
        });

        console.log('✅ PIX gerado com sucesso para:', nome);

    } catch (error) {
        console.error('❌ Erro ao gerar PIX:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// ✅ FUNÇÃO PARA GERAR PIX
function gerarPayloadPIX({ chave, valor, nome, cidade, identificador }) {
    const payload = [
        '000201',
        '2636',
        '0014br.gov.bcb.pix',
        `01${chave.length.toString().padStart(2, '0')}${chave}`,
        '52040000',
        '5303986',
        `54${valor.toString().length.toString().padStart(2, '0')}${valor}`,
        '5802BR',
        `59${nome.length.toString().padStart(2, '0')}${nome}`,
        `60${cidade.length.toString().padStart(2, '0')}${cidade}`,
        `62${(identificador.length + 4).toString().padStart(2, '0')}`,
        `05${identificador.length.toString().padStart(2, '0')}${identificador}`,
        '6304'
    ].join('');

    // CRC16 simplificado para funcionamento
    const crc = calcularCRC16(payload);
    return payload + crc;
}

// ✅ FUNÇÃO CRC16
function calcularCRC16(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

// ✅ HEALTH CHECK
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor funcionando!',
        timestamp: new Date().toISOString()
    });
});

// ✅ ROTA DE FALLBACK - IMPORTANTE!
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ INICIAR SERVIDOR
app.listen(PORT, () => {
    console.log('🚀 SERVIDOR INICIADO COM SUCESSO!');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`💰 PIX: ${MINHA_CHAVE_PIX}`);
    console.log('✅ Pronto para receber pedidos!');
});