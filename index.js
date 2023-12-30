// with templates updated

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();
const Joi = require("joi");

const app = express().use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

db.once("open", () => {
  console.log("Connected to MongoDB");
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

const SchemeModel = mongoose.model("Scheme", schemeSchema);

let collectedData = {};
const token = process.env.TOKEN;
const myToken = process.env.MYTOKEN;

async function filterSchemes(age, gender, state, disability, income) {
  try {
    const schemesData = await SchemeModel.find({
      age,
      genderEligibility: gender,
      implementedBy: state,
      disabilityPercentage: disability,
      annualIncome: income,
    });
    return schemesData;
  } catch (error) {
    console.error("Error filtering schemes:", error.message);
    throw error;
  }
}

// Define Joi schema for input validation
const nameSchema = Joi.object({
  name: Joi.string().pattern(new RegExp("^[a-zA-Z]+$")).required(),
});

const emailSchema = Joi.object({
  email: Joi.string().email().regex(/^[^\s@]+@gmail\.com$/).required(),
});
app.listen(process.env.PORT, () => {
  console.log("Webhook is listening!!");
});

app.get("/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const challenge = req.query["hub.challenge"];
  const verifyToken = req.query["hub.verify_token"];

  if (mode && verifyToken) {
    if (mode === "subscribe" && verifyToken === myToken) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Invalid verify token");
    }
  } else {
    res.status(400).send("Missing parameters");
  }
});

app.post("/whatsapp", async (req, res) => {
  const bodyParam = req.body;
  console.log("Request Body:", bodyParam);

  if (
    bodyParam.object &&
    bodyParam.entry &&
    bodyParam.entry[0].changes &&
    bodyParam.entry[0].changes[0].value.messages &&
    bodyParam.entry[0].changes[0].value.messages[0]
  ) {
    const phoneNumberId =
      bodyParam.entry[0].changes[0].value.metadata.phone_number_id;
    const message = bodyParam.entry[0].changes[0].value.messages[0];
    const msgBody = (message.text?.body || "").toLowerCase();
    const payload = message.button ? message.button.payload : undefined;

    console.log("message:", message);

    try {
      let responseTemplate;

      switch (true) {
        case msgBody.includes("hello") || msgBody.includes("hi"):
          responseTemplate = {
            messaging_product: "whatsapp",
            to: "+919788825633",
            type: "template",
            template: {
              name: "greet",
              language: {
                code: "en_US",
              },
            },
          };
          break;

        case payload === "Let's Explore":
          responseTemplate = {
            messaging_product: "whatsapp",
            to: "+919788825633",
            type: "template",
            template: {
              name: "name",
              language: {
                code: "en_US",
              },
            },
          };

          collectedData.nameProcessed = true;
          break;

          case collectedData.nameProcessed && typeof msgBody === "string":
          const nameValidationResult = nameSchema.validate({ name: msgBody });

          if (nameValidationResult.error) {
            responseTemplate = {
              messaging_product: "whatsapp",
              to: "+919788825633",
              type: "text",
              text: {
                body: "Invalid name format. Please provide a valid name.",
              },
              language: {
                code: "en_US",
              },
            };
          } else {
            // Validation successful
            collectedData.name = msgBody;
            responseTemplate = {
              messaging_product: "whatsapp",
              to: "+919788825633",
              type: "template",
              template: {
                name: "email",
                language: {
                  code: "en_US",
                },
              },
            };
            collectedData.emailProcessed = true;
          }
          break;

        case collectedData.emailProcessed && typeof msgBody === "string":
          const emailValidationResult = emailSchema.validate({ email: msgBody });

          if (emailValidationResult.error) {
            // Validation failed
            responseTemplate = {
              messaging_product: "whatsapp",
              to: "+919788825633",
              type: "text",
              text: {
                body: "Invalid email format. Please provide a valid email address.",
              },
              language: {
                code: "en_US",
              },
            };
          } else {
            // Validation successful
            collectedData.email = msgBody;
            responseTemplate = {
              messaging_product: "whatsapp",
              to: "+919788825633",
              type: "template",
              template: {
                name: "phone",
                language: {
                  code: "en_US",
                },
              },
            };
            collectedData.phoneProcessed = true;
          }
          break;

        case payload === "Go to Main Menu":
          responseTemplate = {
            messaging_product: "whatsapp",
            to: "+919788825633",
            type: "template",
            template: {
              name: "scheme_template",
              language: {
                code: "en_US",
              },
              components: [
                {
                  type: "header",
                  parameters: [
                    {
                      type: "image",
                      image: {
                        link: " https://i.imgur.com/0uVWYeR.jpeg",
                      },
                    },
                  ],
                },
              ],
            },
          };
          break;

        case payload === "Not now":
          responseTemplate = {
            messaging_product: "whatsapp",
            to: "+919788825633",
            type: "text",
            text: {
              body: `I appreciate your consideration. Please feel free to reach out whenever you have a moment. When you're ready to continue, a simple "HI" or "HELLO" would be great. Thank you for your understanding. Have a wonderful day! 🌟`,
            },
            language: {
              code: "en_US",
            },
          };
          break;

        case payload === "Show Schemes":
          responseTemplate = {
            messaging_product: "whatsapp",
            to: "+919788825633",
            type: "template",
            template: {
              name: "age",
              language: {
                code: "en_US",
              },
            },
          };
          break;

        case payload === "0-6" || payload === "6-18" || payload === "18-24":
          collectedData.age = payload;
          console.log("Collected Data age:", collectedData.age);
          responseTemplate = {
            messaging_product: "whatsapp",
            to: "+919788825633",
            type: "template",
            template: {
              name: "gender",
              language: {
                code: "en_US",
              },
            },
          };
          break;

        case payload === "Male" ||
          payload === "Female" ||
          payload === "Both Male and Female":
          collectedData.gender = payload;
          console.log("Collected Data gender:", collectedData);
          responseTemplate = {
            messaging_product: "whatsapp",
            to: "+919788825633",
            type: "template",
            template: {
              name: "state",
              language: {
                code: "en_US",
              },
            },
          };
          break;

        case payload === "TAMIL NADU" ||
          payload === "MAHARASHTRA" ||
          payload === "GOA":
          collectedData.state = payload;
          console.log("Collected Data:", collectedData);
          responseTemplate = {
            messaging_product: "whatsapp",
            to: "+919788825633",
            type: "template",
            template: {
              name: "disability",
              language: {
                code: "en_US",
              },
            },
          };
          break;

        case payload === "Minimum 40%" || payload === "Minimum 90%":
          collectedData.disability = payload;
          console.log("Collected Data:", collectedData);
          responseTemplate = {
            messaging_product: "whatsapp",
            to: "+919788825633",
            type: "template",
            template: {
              name: "income",
              language: {
                code: "en_US",
              },
            },
          };
          break;

        case payload === "1,25,000" ||
          payload === "1,75,000" ||
          payload === "No income limit":
          collectedData.income = payload;
          console.log("Collected Data:", collectedData);

          try {
            const schemesData = await filterSchemes(
              collectedData.age,
              collectedData.gender,
              collectedData.state,
              collectedData.disability,
              collectedData.income
            );

            const count = schemesData.length;

            if (schemesData.length > 0) {
              let responseMessage = `Matching schemes: ${count}\n\n`;

              schemesData.forEach((scheme) => {
                responseMessage +=
                  `Implemented By: ${
                    scheme.implementedBy || "Not available"
                  }\n` +
                  `Domain Description: ${
                    scheme.domainDescription || "Not available"
                  }\n` +
                  `Eligible Disabilities: ${
                    scheme.eligibleDisabilities || "Not available"
                  }\n` +
                  `Disability Percentage: ${
                    scheme.disabilityPercentage || "Not available"
                  }\n` +
                  `Age: ${scheme.age || "Not available"}\n` +
                  `Annual Income: ${scheme.annualIncome || "Not available"}\n` +
                  `Gender Eligibility: ${
                    scheme.genderEligibility || "Not available"
                  }\n` +
                  `Comments: ${scheme.comments || "Not available"}\n` +
                  `Email Address: ${
                    scheme.emailAddress || "Not available"
                  }\n\n`;
              });

              const truncatedMessage = responseMessage.substring(0, 4096);

              responseTemplate = {
                messaging_product: "whatsapp",
                to: "+919788825633",
                type: "text",
                text: {
                  body: truncatedMessage,
                },
                language: {
                  code: "en_US",
                },
              };
              console.log(
                "Response Template for Matching Schemes:",
                responseTemplate
              );
            } else {
              responseTemplate = {
                messaging_product: "whatsapp",
                to: "+919788825633",
                type: "text",
                text: {
                  body: "No matching schemes found. Please refine your search criteria.",
                },
                language: {
                  code: "en_US",
                },
              };
              console.log(
                "Response Template for No Matching Schemes:",
                responseTemplate
              );
            }
          } catch (error) {
            console.error("Error processing schemes:", error.message);
          }

          if (responseTemplate) {
            try {
              const response = await axios.post(
                `https://graph.facebook.com/v17.0/${phoneNumberId}/messages?access_token=${token}`,
                responseTemplate
              );
              console.log("Response:", response.data);
              res.status(200).send(response.data);
              return;
            } catch (error) {
              console.error(
                "Error sending response:",
                error.message,
                error.response ? error.response.data : ""
              );
              res.status(500).send(error.message);
              return;
            }
          } else {
            console.log("Response Template is undefined. No response sent.");
            res.status(200).send("");
          }

        default:
          responseTemplate = {
            messaging_product: "whatsapp",
            to: "+919788825633",
            type: "template",
            template: {
              name: "alert",
              language: {
                code: "en_US",
              },
            },
          };
          console.log("Switch Case: Default");
          break;
      }
      console.log("Final Response Template:", responseTemplate);
      const response = await axios.post(
        `https://graph.facebook.com/v17.0/${phoneNumberId}/messages?access_token=${token}`,
        responseTemplate
      );
      console.log("Response:", response.data);
      res.status(200).send(response.data);
      return;
    } catch (error) {
      console.error(
        "Error sending response:",
        error.message,
        error.response ? error.response.data : ""
      );
      res.status(500).send(error.message);
      return;
    }
  } else {
    res.status(404).send("Invalid request format");
    return;
  }
});

app.get("/", (req, res) => {
  res.status(200).send("Webhook setup for scheme!!");
});

// responseTemplate = {
//   messaging_product: "whatsapp",
//   to: "+919788825633",
//   type: "template",
//   template: {
//     name: "photo",
//     language: {
//       code: "en_US",
//     },
//     components: [
//       {
//           type: "header",
//           parameters: [
//               {
//                   type: "image",
//                   image: {
//                       link: "https://bd.gaadicdn.com/upload/userfiles/images/640b011e05ee5.jpg"
//                   }
//               }
//           ]
//       }
//   ]
//   },
// };
