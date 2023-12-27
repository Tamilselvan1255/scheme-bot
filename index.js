// with templates updated

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express().use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

db.once('open', () => {
    console.log('Connected to MongoDB');
});

const schemeSchema = new mongoose.Schema({
    implementedBy: String,
    domainDescription: String,
    eligibleDisabilities: String,
    disabilityPercentage: String,
    age: String,
    annualIncome: String,
    genderEligibility: String,
    comments: String,
    emailAddress: String,
});


const SchemeModel = mongoose.model('Scheme', schemeSchema);


const filterFacilities = async (state, disability, age, income, gender) => {
    const filter = {
        implementedBy: state ? state : { $exists: true },
        disabilityPercentage: disability ? disability : { $exists: true },
        age: age ? age : { $exists: true },
        annualIncome: income ? income : { $exists: true },
        genderEligibility: gender ? gender : { $exists: true },
    };

    return await SchemeModel.find(filter);
};

const token = process.env.TOKEN;
const myToken = process.env.MYTOKEN;

app.listen(process.env.PORT, () => {
    console.log('Webhook is listening!!');
});

app.get('/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = req.query['hub.verify_token'];

    if (mode && verifyToken) {
        if (mode === 'subscribe' && verifyToken === myToken) {
            res.status(200).send(challenge);
        } else {
            res.status(403).send('Invalid verify token');
        }
    } else {
        res.status(400).send('Missing parameters');
    }
});

app.post('/whatsapp', async (req, res) => {
    const bodyParam = req.body;
    console.log('Request Body:', bodyParam);

    if (
        bodyParam.object &&
        bodyParam.entry &&
        bodyParam.entry[0].changes &&
        bodyParam.entry[0].changes[0].value.messages &&
        bodyParam.entry[0].changes[0].value.messages[0]
    ) {
        const phoneNumberId = bodyParam.entry[0].changes[0].value.metadata.phone_number_id;
        const message = bodyParam.entry[0].changes[0].value.messages[0];
        const msgBody = (message.text?.body || '').toLowerCase();
        const payload = message.button ? message.button.payload : undefined;

        console.log('message:', message);

        try {
            let responseTemplate;

            switch (true) {
                case msgBody.includes('hello') || msgBody.includes('hi'):
                    responseTemplate = {
                        messaging_product: 'whatsapp',
                        to: '+919788825633',
                        type: 'template',
                        template: {
                            name: 'scheme_template',
                            language: {
                                code: 'en_US',
                            },
                        },
                    };
                    break;
                    
                case payload === 'Yes':
                    responseTemplate = {
                        messaging_product: 'whatsapp',
                        to: '+919788825633',
                        type: 'template',
                        template: {
                            name: 'scheme_template',
                            language: {
                                code: 'en_US',
                            },
                        },
                    };
                    break;

                    case payload === 'Not Now':
                    responseTemplate = {
                        messaging_product: 'whatsapp',
                        to: '+919788825633',
                        type: 'text',
                        text: {
                            body: `I appreciate your consideration. Please feel free to reach out whenever you have a moment. When you're ready to continue, a simple "HI" or "HELLO" would be great. Thank you for your understanding. Have a wonderful day! 🌟`,
                        },
                        language: {
                            code: 'en_US',
                        },
                    };
                    break;


                case payload === 'Show Schemes':
                    responseTemplate = {
                        messaging_product: 'whatsapp',
                        to: '+919788825633',
                        type: 'template',
                        template: {
                            name: 'age',
                            language: {
                                code: 'en_US',
                            },
                        },
                    };
                    break;

                    case payload === '0-6' || payload === '6-18' || payload === '18-24':
                        var age = payload;
                        console.log(age);
                        responseTemplate = {
                            messaging_product: 'whatsapp',
                            to: '+919788825633',
                            type: 'template',
                            template: {
                                name: 'gender',
                                language: {
                                    code: 'en_US',
                                },
                            },
                        };
                        break;

                        case payload === 'Male' || payload === 'Female' || payload === 'Both Male and Female':
                            var gender = payload;
                        console.log(gender);
                        responseTemplate = {
                            messaging_product: 'whatsapp',
                            to: '+919788825633',
                            type: 'template',
                            template: {
                                name: 'state',
                                language: {
                                    code: 'en_US',
                                },
                            },
                        };
                        break;

                        case payload === 'TAMIL NADU' || payload === 'MAHARASHTRA' || payload === 'GOA':
                            var state = payload;
                            console.log(state);
                       responseTemplate = {
                            messaging_product: 'whatsapp',
                            to: '+919788825633',
                            type: 'template',
                            template: {
                                name: 'disability',
                                language: {
                                    code: 'en_US',
                                },
                            },
                        };
                        break;
                        
                        case payload === 'Minimum 40%' || payload === 'Minimum 90%':
                            var disability = payload;
                            console.log(disability);
                            responseTemplate = {
                                messaging_product: 'whatsapp',
                                to: '+919788825633',
                                type: 'template',
                                template: {
                                    name: 'income',
                                    language: {
                                        code: 'en_US',
                                    },
                                },
                            };
                            break;

                            case payload === '1,25,000' || payload === '1,75,000' || payload === 'No income limit':
                                var income = payload;
                                console.log(income);
                                responseTemplate = {
                                    messaging_product: 'whatsapp',
                                    to: '+919788825633',
                                    type: 'template',
                                    template: {
                                        name: 'dealss',
                                        language: {
                                            code: 'en_US',
                                        },
                                    },
                                };
                                break;

                                case payload === 'dealss':
                                    // Extracting previous user selections
                                    const ageSelection = bodyParam.entry[0].changes[0].value.messages[1].quick_reply.payload;
                                    const genderSelection = bodyParam.entry[0].changes[0].value.messages[2].quick_reply.payload;
                                    const stateSelection = bodyParam.entry[0].changes[0].value.messages[3].quick_reply.payload;
                                    const disabilitySelection = bodyParam.entry[0].changes[0].value.messages[4].quick_reply.payload;
                                    const incomeSelection = bodyParam.entry[0].changes[0].value.messages[5].quick_reply.payload;
                    
                                    // Filtering facilities based on user selections
                                    const filteredFacilities = await filterFacilities(stateSelection, disabilitySelection, ageSelection, incomeSelection, genderSelection);
                    
                                    // Check if there are matching facilities
                                    if (filteredFacilities.length !== 0) {
                                        // Convert the fetched data to a text response
                                        const textResponse = filteredFacilities.map(facility => {
                                            return `Facility: ${facility.domainDescription}\nEligibility: ${facility.eligibleDisabilities}\nComments: ${facility.comments}\n\n`;
                                        }).join('\n');
                    
                                        // Adjust the response as needed
                                        responseTemplate = {
                                            messaging_product: 'whatsapp',
                                            to: '+919788825633',
                                            type: 'text',
                                            text: {
                                                body: `Matching facilities:\n\n${textResponse}`,
                                            },
                                            language: {
                                                code: 'en_US',
                                            },
                                        };
                                    } else {
                                        responseTemplate = {
                                            messaging_product: 'whatsapp',
                                            to: '+919788825633',
                                            type: 'text',
                                            text: {
                                                body: "No matching facilities found. Please refine your search criteria.",
                                            },
                                            language: {
                                                code: 'en_US',
                                            },
                                        };
                                    }
                                    break;
                default:
                    responseTemplate = {
                        messaging_product: 'whatsapp',
                        to: '+919788825633',
                        type: 'text',
                        text: {
                            body: "Please enter valid message!",
                        },
                        language: {
                            code: 'en_US',
                        },
                    };
                    break;
            }

           
        
            const response = await axios.post(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages?access_token=${token}`, responseTemplate);
            console.log('Response:', response.data);
            res.status(200).send(response.data);
        } catch (error) {
            console.error('Error sending response:', error.message, error.response ? error.response.data : '');
            res.status(500).send(error.message);
        }
    } else {
        res.status(404).send('Invalid request format');
    }
});


app.get('/', (req, res) => {
    res.status(200).send('Webhook setup for scheme!!');
});

// ----------------------

// else if (msgBody.toLowerCase().includes('show schemes')) {
//     const showSchemesTemplate = {
//         messaging_product: 'whatsapp',
//         to: '+919788825633', 
//         type: 'template',
//         template: {
//             name: 'deals',
//             language: {
//             code: 'en_US',
//         },
//         },
//     };

//     try {
//         const response = await axios.post(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages?access_token=${token}`, showSchemesTemplate);
//         console.log('Response:', response.data);
//         res.status(200);
//         return;
//     } catch (error) {
//         console.error('Error sending show schemes template:', error.message, error.response ? error.response.data : '');
//         res.status(500);
//         return;
//     }
// }

// from database


// const express = require('express');
// const bodyParser = require('body-parser');
// const axios = require('axios');
// const mongoose = require('mongoose');
// require('dotenv').config();

// const app = express().use(bodyParser.json());

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
// const db = mongoose.connection;

// db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.once('open', () => {
//     console.log('Connected to MongoDB');
// });

// // Define a Mongoose schema for the "schemes" collection
// const schemeSchema = new mongoose.Schema({
//     _id: mongoose.Schema.Types.ObjectId,
//     niProvider: String,
//     schemeName: String,
//     implementedBy: String,
//     domainDescription: String,
//     eligibleDisabilities: String,
//     disabilityPercentage: String,
//     age: String,
//     annualIncome: String,
//     genderEligibility: String,
//     comments: String,
//     attachments: String,
// });


// // Create a Mongoose model based on the schema
// const Scheme = mongoose.model('Scheme', schemeSchema);

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

//     if (body_param.object && body_param.entry &&
//         body_param.entry[0].changes &&
//         body_param.entry[0].changes[0].value.messages &&
//         body_param.entry[0].changes[0].value.messages[0]) {

//         let phone_number_id = body_param.entry[0].changes[0].value.metadata.phone_number_id;
//         let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

//         // Retrieve scheme data from the "schemes" collection based on user input
//         try {
//             const keyword = msg_body.toLowerCase();
//             const schemes = await Scheme.find({ schemeName: { $regex: keyword, $options: 'i' } });


//             let responseMessage;

//             if (schemes.length > 0) {
//                 // Construct a response message based on the retrieved schemes
//                 responseMessage = "Here are some schemes matching your query:\n";
//                 schemes.forEach((scheme) => {
//                     responseMessage += 
//                     `*Scheme Name:* ${scheme.schemeName}\n*Description:* ${scheme.domainDescription}\n*Comments:* ${scheme.comments}\n*NIProvider:* ${scheme.niProvider}\n*State:* ${scheme.implementedBy}\n*Eligible Disabilities:* ${scheme.eligibleDisabilities}\n*Disability Percentage:* ${scheme.disabilityPercentage}\n*Age:* ${scheme.age}\n*Annual Income:* ${scheme.annualIncome}\n*Gender:* ${scheme.genderEligibility}\n*Attachments:* ${scheme.attachments}\n\n`;
//                 });
//             } else {
//                 responseMessage = "Sorry, no schemes found matching your query.";
//             }

//             const body = {
//                 "messaging_product": "whatsapp",
//                 "to": "+919788825633", // Replace with the recipient's phone number
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
//         } catch (error) {
//             console.error("Error retrieving scheme data:", error);
//             res.sendStatus(500);
//         }
//     } else {
//         res.sendStatus(404);
//     }
// });

// app.get("/", (req, res) => {
//     res.status(200).send("Webhook setup for scheme!!");
// });


// ----------------------

// chabot alone

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

//             // If a greeting is detected, respond with "scheme_template"
//             const greetingTemplate = {
//                 "messaging_product": "whatsapp",
//                 "to": "+919788825633",
//                 "type": "template",
//                 "template": {
//                     "name": "scheme_template"
//                 },
//                 "language": "en_US" // Add the language parameter
//             };
            
//             let responseMessage;

//             // Implement your chatbot logic here
//             if (msg_body.toLowerCase().includes("hello")) {
//                 try {
//                     const response = await axios.post(`https://graph.facebook.com/v17.0/${phone_number_id}/messages?access_token=${token}`, greetingTemplate);
//                     console.log(response.data);  // Log the response data for debugging
//                 } catch (error) {
//                     console.error(error.response.data);  // Log the error response data
//                 }
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
//                 "language": "en_US"
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
