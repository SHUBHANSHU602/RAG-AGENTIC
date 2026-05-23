require('dotenv').config();
const express =require('express');
const app =express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get('/health' , (req, res)=>{
    res.json({
        status:'ohk',
        message:'agentic-rag running'
    })
})
const port =process.env.PORT || 3000;
app.listen(port ,()=>{
    console.log('yes, server is running');
});