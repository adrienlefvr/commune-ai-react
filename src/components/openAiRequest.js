import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_KEY,
  dangerouslyAllowBrowser: true
});



export async function callOpenAIAPI(topic, message) {
    const prompt = "Research topic: " + topic + "\nIdentify underlying ethical norms that motiviate this stakeholder's testimony: : " + message + "\nSelect a minimum of 1  and up to 5, depending on how many ideas are expressed in the statement. Present the result as a JavaScript array compatible for parsing, using this example format: ['caring', 'honest, 'resilient', 'self-maintaining', 'self-assured'].";
    console.log(prompt);
    const chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{"role": "user", "content": prompt}],
    });
    
    return chatCompletion.choices[0].message.content;
}