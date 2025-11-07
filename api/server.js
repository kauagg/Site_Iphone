const express = require('express');
const path = require('path');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// SUA CHAVE PIX AQUI - Coloque sua chave PIX real
const MINHA_CHAVE_PIX = 'seu_cpf_ou_celular_ou_email@provedor.com'; // OU sua chave aleatória
const MEU_NOME = 'Seu Nome Completo';
const MINHA_CIDADE = 'Sua Cidade';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

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

// API para gerar QR Code PIX direto
app.post('/api/gerar-pix', async (req, res) => {
    try {
        const { nome, cpf, email } = req.body;
        
        console.log('Cliente:', { nome, cpf, email });

        // Validar dados
        if (!nome || !cpf || !email) {
            return res.status(400).json({ 
                success: false, 
                error: 'Todos os campos são obrigatórios' 
            });
        }

        // Valor da compra em centavos
        const valor = 749900; // R$ 7.499,00
        
        // Gerar payload PIX (formato BR Code)
        const payloadPIX = gerarPayloadPIX({
            chave: MINHA_CHAVE_PIX,
            valor: valor,
            nome: MEU_NOME,
            cidade: MINHA_CIDADE,
            identificador: `IPHONE${Date.now()}`
        });

        // Gerar QR Code
        let qrCodeBase64 = '';
        try {
            qrCodeBase64 = await QRCode.toDataURL(payloadPIX);
        } catch (qrError) {
            console.error('Erro ao gerar QR Code:', qrError);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro ao gerar QR Code' 
            });
        }

        // Retornar dados para o frontend
        const responseData = {
            success: true,
            pix: {
                valor: (valor / 100).toFixed(2),
                qrCode: payloadPIX,
                qrCodeImage: qrCodeBase64,
                chave: MINHA_CHAVE_PIX,
                nome: MEU_NOME,
                identificador: `IPHONE${Date.now()}`,
                instrucoes: `Pague R$ 7.499,00 via PIX para ${MEU_NOME}`
            },
            cliente: {
                nome: nome,
                email: email,
                pedido: `APPLE-${Date.now()}`
            }
        };

        console.log('PIX gerado para:', nome);
        res.json(responseData);

    } catch (error) {
        console.error('Erro no servidor:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor',
            message: error.message 
        });
    }
});

// Função para gerar payload PIX no formato BR Code
function gerarPayloadPIX({ chave, valor, nome, cidade, identificador }) {
    // Formato padrão PIX COPIA E COLA
    const payload = [
        '000201', // Payload Format Indicator
        '2636', // Merchant Account Information
        '0014br.gov.bcb.pix', // GUI
        `01${chave.length.toString().padStart(2, '0')}${chave}`, // Chave PIX
        '52040000', // Merchant Category Code
        '5303986', // Transaction Currency (BRL)
        `54${valor.toString().length.toString().padStart(2, '0')}${valor}`, // Transaction Amount
        '5802BR', // Country Code
        `59${nome.length.toString().padStart(2, '0')}${nome}`, // Merchant Name
        `60${cidade.length.toString().padStart(2, '0')}${cidade}`, // Merchant City
        `62${(identificador.length + 4).toString().padStart(2, '0')}`, // Additional Data Field
        `05${identificador.length.toString().padStart(2, '0')}${identificador}`, // Reference Label
        '6304' // CRC16
    ].join('');

    // Calcular CRC16
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
        service: 'iPhone Store PIX Direto',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor PIX Direto rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
    console.log(`💰 PIX direto para: ${MINHA_CHAVE_PIX}`);
});