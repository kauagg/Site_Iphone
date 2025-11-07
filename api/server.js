const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/assets', express.static('assets'));

// Rotas
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

// API para criar PIX
app.post('/api/create-pix', async (req, res) => {
    try {
        const { nome, cpf, email } = req.body;
        
        // Simulação de criação de PIX
        const pixData = {
            success: true,
            qrCode: "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-42661417400052040000530398654057.495802BR5913Apple Store6008Sao Paulo62290525mpqr-1234567890ABCDEFGH6304A56F",
            valor: "7499.00",
            id: "PIX-" + Date.now()
        };
        
        res.json(pixData);
    } catch (error) {
        res.status(500).json({ error: "Erro ao gerar PIX" });
    }
});

// Health check para deploy
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});