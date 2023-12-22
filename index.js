const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();
const app = express().use(bodyParser.json());

const token = process.env.TOKEN;
const myToken = process.env.MYTOKEN;

app.listen(process.env.PORT, () => {
    console.log("Webhook is listening!!");
});

app.get("/webhook", (req, res) => {
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

app.post("/webhook", async (req, res) => {
    let body_param = req.body;
    console.log(JSON.stringify(body_param, null, 2));

    if (body_param.object) {
        console.log("inside body_param");
        if (body_param.entry &&
            body_param.entry[0].changes &&
            body_param.entry[0].changes[0].value.messages &&
            body_param.entry[0].changes[0].value.messages[0]
        ) {
            let phone_number_id = body_param.entry[0].changes[0].value.metadata.phone_number_id;
            let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

            let responseMessage;

            // Implement your chatbot logic here
            if (msg_body.toLowerCase().includes("hello")) {
                responseMessage = "Hi there! How can I help you today?";
            } else if (msg_body.toLowerCase().includes("cat")) {
                responseMessage = "I love cats!";
            } else if (msg_body.toLowerCase().includes("dog")) {
                responseMessage = "I love dogs!";
            } else {
                responseMessage = "Sorry, I didn't understand that. Can you please clarify?";
            }

            const body = {
                "messaging_product": "whatsapp",
                "to": "+919788825633",
                "type": "template",
                "template": {
                    "text": {
                        "body": responseMessage
                    },
                    "language": {
                        "code": "en_US"
                    }
                }
            };

            try {
                await axios.post(`https://graph.facebook.com/v17.0/${phone_number_id}/messages?access_token=${token}`, body);
                res.sendStatus(200);
            } catch (error) {
                console.error("Error sending message:", error);
                res.sendStatus(500);
            }
        } else {
            res.sendStatus(404);
        }
    }
});

app.get("/", (req, res) => {
    res.status(200).send("Webhook setup for scheme!!");
});
