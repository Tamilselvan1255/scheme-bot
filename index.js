const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

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

const customerSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
});

const CustomerModel = mongoose.model("Customer", customerSchema);

let collectedData = {};
let collectedCustomer = {};
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

let userState = "initial";

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
    const phoneNumber = message.from;
    const msgBody = (message.text?.body || "").toLowerCase();
    const payload = message.button ? message.button.payload : undefined;
    console.log("Payload:", payload);

    console.log("message:", message);

    try {
      let responseTemplate;

      switch (true) {
        case msgBody.includes("hello") || msgBody.includes("hi"):
          responseTemplate = {
            messaging_product: "whatsapp",
            to: phoneNumber,
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
            to: phoneNumber,
            type: "template",
            template: {
              name: "name",
              language: {
                code: "en_US",
              },
            },
          };
          userState = "name";
          console.log("Setting userState to 'name'");
          break;

        case userState === "name" && /^[a-zA-Z]+$/.test(msgBody):
          collectedCustomer.name = msgBody;
          console.log("collectedCustomer name:", collectedCustomer.name);
          responseTemplate = {
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "template",
            template: {
              name: "email",
              language: {
                code: "en_US",
              },
            },
          };
          userState = "email";
          console.log("Setting userState to 'email'");
          break;

        case userState === "email" && isValidEmail(msgBody):
          collectedCustomer.email = msgBody;
          console.log("collectedCustomer email:", collectedCustomer.email);
          responseTemplate = {
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "template",
            template: {
              name: "phone",
              language: {
                code: "en_US",
              },
            },
          };
          userState = "phone";
          break;

        case (userState === "phone" && /^\d{10}$/.test(msgBody)) ||
          payload === "Go to Main Menu":
          collectedCustomer.phone = msgBody;
          console.log("collectedCustomer phone:", collectedCustomer.phone);
          console.log("CollectedCustomer:", collectedCustomer);

          const existingCustomer = await CustomerModel.findOne({
            phone: collectedCustomer.phone,
          });

          if (!existingCustomer) {
            try {
              const savedCustomer = await CustomerModel.create(
                collectedCustomer
              );
              console.log("Customer saved to MongoDB:", savedCustomer);
            } catch (error) {
              console.error("Error saving customer to MongoDB:", error.message);
            }
          } else {
            console.log("Customer already exists in the database");
          }

          responseTemplate = {
            messaging_product: "whatsapp",
            to: phoneNumber,
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
            to: phoneNumber,
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
            to: phoneNumber,
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
            to: phoneNumber,
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
            to: phoneNumber,
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
            to: phoneNumber,
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
            to: phoneNumber,
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
                to: phoneNumber,
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
                to: phoneNumber,
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

              feedbackTemplate = {
                messaging_product: "whatsapp",
                to: phoneNumber,
                type: "template",
                template: {
                  name: "feedback",
                  language: {
                    code: "en_US",
                  },
                },
              };
              const feedback = await axios.post(
                `https://graph.facebook.com/v17.0/${phoneNumberId}/messages?access_token=${token}`,
                feedbackTemplate
              );

              // Store the payload in the collectedCustomer object
              collectedCustomer.Feedback = payload;
              const Feedbacks = collectedCustomer.Feedback;
              console.log("Feedback:", Feedbacks);
              // Check if the customer already exists
              const existingCustomers = await CustomerModel.findOne({
                phone: collectedCustomer.phone,
              });
              if (existingCustomers) {
                // Update the existing customer with the new feedback
                try {
                  const updatedCustomer = await CustomerModel.findOneAndUpdate(
                    { phone: collectedCustomer.phone },
                    { $set: { Feedback: Feedbacks } },
                    { new: true }
                  );

                  console.log("Customer updated:", updatedCustomer);
                } catch (error) {
                  console.error("Error updating customer:", error.message);
                }
              } else {
                console.log("Customer does not exist in the database.");
              }

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
          console.log("Switch Case: Default");
          responseTemplate = {
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "template",
            template: {
              name: "alert",
              language: {
                code: "en_US",
              },
            },
          };
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
