const fetch = require('node-fetch');
const { v4 } = require('uuid');
module.exports = async (req,res)=>{
  const {nome,cpf,email} = req.body;
  const correlationID = v4();
  const body = {
    name:'iPhone 15 Pro Max',
    value:10000, // centavos
    correlationID,
    expiresIn:600 // 10 min
  };
  const r = await fetch('https://api.openpix.com.br/api/v1/charge',{
    method:'POST',
    headers:{Authorization:'SEU_OPENPIX_APP_ID','Content-Type':'application/json'},
    body:JSON.stringify(body)
  });
  const data = await r.json();
  res.json({qr:data.charge.qrCodeImage,copia:data.charge.brCode});
};