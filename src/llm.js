require('dotenv').config();
const Groq= require('groq-sdk');
const groq= new Groq({
    apiKey:process.env.GROQ_AI_KEY
});
async function chat(message) {
    const response =await groq.chat.completions.create({
        model:'llama-3.3-70b-versatile',
        message,
        temperature:0.1
    });
    return response.choice[0].message.content;
}
module.exports={chat};