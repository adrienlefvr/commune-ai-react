const functions = require('firebase-functions');
const admin = require("firebase-admin");
const OpenAI = require('openai');

admin.initializeApp();

const openai = new OpenAI({
    apiKey: functions.config().openai.key
});

exports.callOpenAIAPI = functions.region('europe-west1').https.onCall(async (data, context) => {
    const { prompt } = data;

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





