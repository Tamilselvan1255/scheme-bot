const express = require('express');
const body_parser = require('body-parser');
const axios = require('axios');
require('dotenv').config;

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

app.post("/webhook", (req, res) => {
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
            let from = body_param.entry[0].changes[0].value.messages[0].from;
            let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

            let newTemplateMessage = "Hi there! Thanks for reaching out. Your message is important to us.";

            // axios.post(`https://graph.facebook.com/v17.0/${phone_number_id}/messages?access_token=${token}`, {
            //     messaging_product: "whatsapp",
            //     to: from,
            //     text: {
            //         body: newTemplateMessage
            //     }
            // }, {
            //     headers: {
            //         "Content-Type": "application/json"
            //     }
            // });
            axios.post(`https://graph.facebook.com/v17.0/${phone_number_id}/messages?access_token=${token}`, {
                "messaging_product": "whatsapp",
                "to": from,
                "type": "template",
                "template": {
                    "name": "deals",
                    "language": {
                        "code": "en"
                      },                      
                  "components": [
                    {
                      "type": "header",
                      "parameters": [
                        {
                          "type": "image",
                          "image": {
                            "link": "https://goldenbroasted.com/wp-content/uploads/2022/11/Prawn-Biryani-Recipe.jpg"
                          }
                        }
                      ]
                    },
                    {
                      "type": "body",
                      "parameters": [
                        {
                          "type": "text",
                          "text": "THURSDAY DEALS 🥳 🥗🥘"
                        },
                        {
                          "type": "text",
                          "text": "Grab your dishes for the best prices at today's deal."
                        },
                        {
                          "type": "currency",
                          "currency": {
                            "fallback_value": "VALUE",
                            "code": "USD",
                            "amount_1000": 1000
                          }
                        },
                        {
                          "type": "date_time",
                          "date_time": {
                            "fallback_value": "MONTH DAY, YEAR"
                          }
                        }
                      ]
                    },
                    {
                      "type": "button",
                      "sub_type": "quick_reply",
                      "index": "0",
                      "parameters": [
                        {
                          "type": "payload",
                          "payload": "order"
                        }
                      ]
                    },
                    {
                      "type": "button",
                      "sub_type": "quick_reply",
                      "index": "1",
                      "parameters": [
                        {
                          "type": "payload",
                          "payload": "not_interested"
                        }
                      ]
                    }
                  ]
                }
              }
              , {
                headers: {
                    "Content-Type": "application/json"
                }
            });

            res.sendStatus(200);
        } else {
            res.sendStatus(404)
        }
    }
});

app.get("/", (req, res) => {
    res.status(200).send("Hello, this is Webhook setup!!")
});
