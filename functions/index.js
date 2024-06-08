const functions = require("firebase-functions");
const admin = require("firebase-admin");
const OpenAI = require('openai');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Ensure your Firebase functions are initialized with a region if needed
const regionalFunctions = functions.region('europe-west1');

exports.callOpenAIAPI = regionalFunctions.https.onCall(async (data, context) => {
    console.log("Function has been triggered", data);

    // Correct way to access environment config variables
    const openai = new OpenAI({
        apiKey: admin.instanceId().app.options.openai.key
        // Alternatively, use environment variables like below
        // apiKey: functions.config().openai.key
    });

    const { topic, message } = data;
    const prompt = `Research topic: ${topic}\nIdentify underlying ethical norms that motivate this stakeholder's testimony: ${message}\nSelect a minimum of 1 and up to 5, depending on how many ideas are expressed in the statement. Present the result as a JavaScript array compatible for parsing, using this example format: ['caring', 'honest', 'resilient', 'self-maintaining', 'self-assured'].`;

    try {
        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{"role": "user", "content": prompt}],
        });
        return {result: chatCompletion.choices[0].message.content}; // Ensure to return an object
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        throw new functions.https.HttpsError('unknown', 'Failed to fetch data from OpenAI', error);
    }
});

