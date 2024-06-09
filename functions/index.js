const functions = require('firebase-functions');
const admin = require("firebase-admin");
const OpenAI = require('openai');

admin.initializeApp();

const openai = new OpenAI({
    apiKey: functions.config().openai.key
});

exports.callOpenAIAPI = functions.region('europe-west1').https.onCall(async (data, context) => {
    const { topic, message } = data;
    const prompt = "Research topic: " + topic + "\nIdentify underlying ethical norms that motivate this stakeholder's testimony: " + message + "\nSelect a minimum of 1 and up to 5, depending on how many ideas are expressed in the statement. Present the result as a JavaScript array compatible for parsing, using this example format: ['caring', 'honest', 'resilient', 'self-maintaining', 'self-assured'].";

    try {
        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{"role": "user", "content": prompt}],
        });
        return { result: chatCompletion.choices[0].message.content };
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        throw new functions.https.HttpsError('unknown', 'Failed to fetch data from OpenAI', error);
    }
});





