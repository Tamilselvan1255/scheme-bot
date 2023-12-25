const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express().use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define a Mongoose schema for the "schemes" collection
const schemeSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    niProvider: String,
    schemeName: String,
    implementedBy: String,
    domainDescription: String,
    eligibleDisabilities: String,
    disabilityPercentage: String,
    age: String,
    annualIncome: String,
    genderEligibility: String,
    comments: String,
    attachments: String,
});


// Create a Mongoose model based on the schema
const Scheme = mongoose.model('Scheme', schemeSchema);

const token = process.env.TOKEN;
const myToken = process.env.MYTOKEN;

app.listen(process.env.PORT, () => {
    console.log("Webhook is listening!!");
});

app.get("/whatsapp", (req, res) => {
    let mode = req.query["hub.mode"];
    let challenge = req.query["hub.challenge"];
    let token = req.query["hub.verify_token"];

    if (mode && token) {
        if (mode === "subscribe" && token === myToken) {
            res.status(200).send(challenge);
        } else {
            res.status(403);
        }
    }
});

app.post("/whatsapp", async (req, res) => {
    let body_param = req.body;
    
    if (body_param.object && body_param.entry &&
        body_param.entry[0].changes &&
        body_param.entry[0].changes[0].value.messages &&
        body_param.entry[0].changes[0].value.messages[0]) {

        let phone_number_id = body_param.entry[0].changes[0].value.metadata.phone_number_id;
        let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

        // Retrieve scheme data from the "schemes" collection based on user input
        try {
            const keyword = msg_body.toLowerCase();
            const schemes = await Scheme.find({ schemeName: { $regex: keyword, $options: 'i' } });

       
            let responseMessage;

            if (schemes.length > 0) {
                // Construct a response message based on the retrieved schemes
                responseMessage = "Here are some schemes matching your query:\n";
                schemes.forEach((scheme) => {
                    responseMessage += 
                    `*Scheme Name:* ${scheme.schemeName}\n*Description:* ${scheme.domainDescription}\n*Comments:* ${scheme.comments}\n*NIProvider:* ${scheme.niProvider}\n*State:* ${scheme.implementedBy}\n*Eligible Disabilities:* ${scheme.eligibleDisabilities}\n*Disability Percentage:* ${scheme.disabilityPercentage}\n*Age:* ${scheme.age}\n*Annual Income:* ${scheme.annualIncome}\n*Gender:* ${scheme.genderEligibility}\n*Attachments:* ${scheme.attachments}\n\n`;
                });
            } else {
                responseMessage = "Sorry, no schemes found matching your query.";
            }

            const body = {
                "messaging_product": "whatsapp",
                "to": phone_number_id, // Replace with the recipient's phone number
                "type": "text",
                "text": {
                    "body": responseMessage
                },
                "language": {
                    "code": "en_US"
                }
            };

            try {
                await axios.post(`https://graph.facebook.com/v17.0/${phone_number_id}/messages?access_token=${token}`, body);
                res.sendStatus(200);
            } catch (error) {
                console.error("Error sending message:", error);
                res.sendStatus(500);
            }
        } catch (error) {
            console.error("Error retrieving scheme data:", error);
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(404);
    }
});

app.get("/", (req, res) => {
    res.status(200).send("Webhook setup for scheme!!");
});


// const express = require('express');
// const bodyParser = require('body-parser');
// const axios = require('axios');
// require('dotenv').config();
// const app = express().use(bodyParser.json());

// const token = process.env.TOKEN;
// const myToken = process.env.MYTOKEN;

// app.listen(process.env.PORT, () => {
//     console.log("Webhook is listening!!");
// });

// app.get("/whatsapp", (req, res) => {
//     let mode = req.query["hub.mode"];
//     let challenge = req.query["hub.challenge"];
//     let token = req.query["hub.verify_token"];

//     if (mode && token) {
//         if (mode === "subscribe" && token === myToken) {
//             res.status(200).send(challenge);
//         } else {
//             res.status(403);
//         }
//     }
// });

// app.post("/whatsapp", async (req, res) => {
//     let body_param = req.body;
//     console.log(JSON.stringify(body_param, null, 2));

//     if (body_param.object) {
//         console.log("inside body_param");
//         if (body_param.entry &&
//             body_param.entry[0].changes &&
//             body_param.entry[0].changes[0].value.messages &&
//             body_param.entry[0].changes[0].value.messages[0]
//         ) {
//             let phone_number_id = body_param.entry[0].changes[0].value.metadata.phone_number_id;
//             let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

//             let responseMessage;

//             // Implement your chatbot logic here
//             if (msg_body.toLowerCase().includes("hello")) {
//                 responseMessage = "Hi there! How can I help you today?";
//             } else if (msg_body.toLowerCase().includes("cat")) {
//                 responseMessage = "I love cats!";
//             } else if (msg_body.toLowerCase().includes("dog")) {
//                 responseMessage = "I love dogs!";
//             } else {
//                 responseMessage = "Sorry, I didn't understand that. Can you please clarify?";
//             }

//             const body = {
//                 "messaging_product": "whatsapp",
//                 "to": "+919788825633",
//                 "type": "text",
//                 "text": {
//                     "body": responseMessage
//                 },
//                 "language": {
//                     "code": "en_US"
//                 }
//             };
            

//             try {
//                 await axios.post(`https://graph.facebook.com/v17.0/${phone_number_id}/messages?access_token=${token}`, body);
//                 res.sendStatus(200);
//             } catch (error) {
//                 console.error("Error sending message:", error);
//                 res.sendStatus(500);
//             }
//         } else {
//             res.sendStatus(404);
//         }
//     }
// });

// app.get("/", (req, res) => {
//     res.status(200).send("Webhook setup for scheme!!");
// });


     // const schemes = await Scheme.find({
            //     $or: [
            //       { schemeName: { $regex: keyword, $options: 'i' } },
            //       { domainDescription: { $regex: keyword, $options: 'i' } },
            //       { niProvider: { $regex: keyword, $options: 'i' } },
            //       { implementedBy: { $regex: keyword, $options: 'i' } },
            //       { eligibleDisabilities: { $regex: keyword, $options: 'i' } },
            //       { disabilityPercentage: { $regex: keyword, $options: 'i' } },
            //       { age: { $regex: keyword, $options: 'i' } },
            //       { annualIncome: { $regex: keyword, $options: 'i' } },
            //       { genderEligibility: { $regex: keyword, $options: 'i' } }
            //     ]
            //   });