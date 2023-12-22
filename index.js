const express = require('express');
const body_parser = require('body-parser');
const axios = require('axios');
require('dotenv').config;
const fs = require('fs');
const FormData = require('form-data');

const app = express().use(body_parser.json());

const token = process.env.TOKEN; // for sending message to user
const myToken = process.env.MYTOKEN; // for verify

app.listen(process.env.PORT, () => {
    console.log("Webhook is listening!!");
});

// to verify the callback url from dashboard side - cloud api side
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

            // Check if the user sent a message about a cat
            if (msg_body.toLowerCase().includes("cat")) {
                responseMessage = "I love cats!";
            }
            // Check if the user sent a message about a dog
            else if (msg_body.toLowerCase().includes("dog")) {
                responseMessage = "I love dogs!";
            }
            // Default response for other messages
            else {
                responseMessage = "Hi there! Thanks for reaching out. Your message is important to us.";
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
// app.post("/webhook", (req, res) => {
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
//             let from = body_param.entry[0].changes[0].value.messages[0].from;
//             let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

//             let newTemplateMessage = "Hi there! Thanks for reaching out. Your message is important to us.";

//             const body = {
//                 "messaging_product": "whatsapp",
//                 "to": "+919788825633",
//                 "type": "template",
//                 "template": {
//                     "name": "new",
//                     "language": {
//                         "code": "en_US"
//                     }
//                 }
//             };

//             axios.post(`https://graph.facebook.com/v17.0/${phone_number_id}/messages?access_token=${token}`, body);

//             res.sendStatus(200);
//         } else {
//             res.sendStatus(404)
//         }
//     }
// });

app.get("/", (req, res) => {
    res.status(200).send("Hello, this is Webhook setup!!")
});
