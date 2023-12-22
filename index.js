const express = require('express');
const body_parser = require('body-parser');
const axios = require('axios');
require('dotenv').config;
const PORT = process.env.PORT || 3000;


const app = express().use(body_parser.json());

const token = process.env.TOKEN; // for sending message to user
const myToken = process.env.MYTOKEN; // for verify

app.listen(PORT, () => {
    console.log(`Webhook is listening on port ${PORT}!!`);
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
    try {
        let bodyParam = req.body;

        if (bodyParam.object === "page" &&
            bodyParam.entry &&
            bodyParam.entry[0].changes &&
            bodyParam.entry[0].changes[0].value.messages &&
            bodyParam.entry[0].changes[0].value.messages[0]
        ) {
            let phoneNumberId = bodyParam.entry[0].changes[0].value.metadata.phone_number_id;
            let from = bodyParam.entry[0].changes[0].value.messages[0].from;
            let msgBody = bodyParam.entry[0].changes[0].value.messages[0].text.body;

            // let newTemplateMessage = "Hi there! Thanks for reaching out. Your message is important to us.";
            let buttonTemplateMessage = {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: "Hi there! Choose an option:",
                        buttons: [
                            {
                                type: "postback",
                                title: "Option 1",
                                payload: "option1"
                            },
                            {
                                type: "postback",
                                title: "Option 2",
                                payload: "option2"
                            }
                        ]
                    }
                }
            };

            axios.post(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages?access_token=${token}`, {
                messaging_product: "whatsapp",
                to: from,
                ...buttonTemplateMessage
            }, {
                headers: {
                    "Content-Type": "application/json"
                }
            });

            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error("Error processing webhook:", error);
        res.sendStatus(500); 
    }
});
app.get("/", (req, res) => {
    res.status(200).send("Hello, this is Webhook setup!!");
});