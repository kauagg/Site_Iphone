const express = require('express');
const path = require('path');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// SUAS CONFIGURAÇÕES PIX - EDITE AQUI!
const MINHA_CHAVE_PIX = '12345678900'; // 🔥 SUA CHAVE PIX (CPF, celular, email)
const MEU_NOME = 'SEU NOME COMPLETO'; // 🔥 SEU NOME
const MINHA_CIDADE = 'SUA CIDADE'; // 🔥 SUA CIDADE

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.')); // Serve arquivos estáticos da pasta atual

// Rotas para páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'checkout.html'));
});

app.get('/obrigado', (req, res) => {
    res.sendFile(path.join(__dirname, 'obrigado.html'));
});

app.get('/produto', (req, res) => {
    res.sendFile(path.join(__dirname, 'produto.html'));
});

// API para gerar PIX direto
app.post('/api/gerar-pix', async (req, res) => {
    try {
        const { nome, cpf, email } = req.body;
        
        console.log('📦 Novo pedido:', { nome, cpf: cpf.replace(/\D/g, ''), email });

        // Validar dados
        if (!nome || !cpf || !email) {
            return res.status(400).json({ 
                success: false, 
                error: 'Todos os campos são obrigatórios' 
            });
        }

        // Valor em centavos (R$ 7.499,00)
        const valor = 749900;
        const identificador = `IPHONE${Date.now()}`;
        
        // Gerar payload PIX
        const payloadPIX = gerarPayloadPIX({
            chave: MINHA_CHAVE_PIX,
            valor: valor,
            nome: MEU_NOME,
            cidade: MINHA_CIDADE,
            identificador: identificador
        });

        // Gerar QR Code em Base64
        let qrCodeBase64 = '';
        try {
            qrCodeBase64 = await QRCode.toDataURL(payloadPIX);
        } catch (qrError) {
            console.error('❌ Erro ao gerar QR Code:', qrError);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro ao gerar QR Code' 
            });
        }

        // Dados de resposta
        const responseData = {
            success: true,
            pix: {
                valor: (valor / 100).toFixed(2),
                qrCode: payloadPIX,
                qrCodeImage: qrCodeBase64,
                chave: MINHA_CHAVE_PIX,
                nome: MEU_NOME,
                identificador: identificador
            },
            cliente: {
                nome: nome,
                email: email,
                pedido: identificador
            }
        };

        console.log('✅ PIX gerado para:', nome);
        res.json(responseData);

    } catch (error) {
        console.error('❌ Erro no servidor:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor',
            message: error.message 
        });
    }
});

// Função para gerar payload PIX
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

    const crc = calcularCRC16(payload);
    return payload + crc;
}

// Função para calcular CRC16
function calcularCRC16(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    crc = crc & 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        service: 'iPhone Store - PIX Direto',
        timestamp: new Date().toISOString()
    });
});

// Rota padrão para qualquer outra requisição
app.get('*', (req, res) => {
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log('🚀 Servidor iPhone Store iniciado!');
    console.log(`📍 Porta: ${PORT}`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
    console.log(`💰 PIX direto para: ${MINHA_CHAVE_PIX}`);
    console.log('✅ Servidor rodando perfeitamente!');
});