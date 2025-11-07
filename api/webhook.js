module.exports = (req,res)=>{
  const {charge}=req.body;
  if(charge&&charge.status==='COMPLETED'){
    // marca pedido como pago → redireciona cliente
    console.log('💰 PIX recebido:',charge.value);
  }
  res.sendStatus(200);
};