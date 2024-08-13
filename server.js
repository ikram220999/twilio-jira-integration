const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Function to process the prompt
function processPrompt(prompt, from) {
  if (prompt.startsWith("~")) {
    const parts = prompt.split(" ");
    console.log("parts", parts);

    if (parts.length === 3) {
      const command = parts[1];
      const issueKey = parts[2];
      // Extract only the numeric part of the issue key
      //   const issueNumber = issueKey.split("-")[1];

      if (command === "progress" || command === "done") {
        updateJiraIssueStatus(issueKey, command, from);
      } else {
        console.log("Unknown command:", command);
        replyToUser(`Unknown command: ${command} `, from);
      }
    } else {
      console.log("Invalid prompt format.");
      replyToUser(`Invalid prompt format.`, from);
    }
  } else {
    return 2;
  }
}

app.post("/whatsapp", (req, res) => {
  const message = req.body.Body;
  const from = req.body.From;

  // Process the message and interact with Jira API
  const jiraIssue = {
    fields: {
      project: { key: "IK" },
      summary: `WhatsApp message from ${from}`,
      description: message,
      issuetype: { name: "Task" },
    },
  };
  console.log(process.env.EMAIL, process.env.API_KEY);

  let result = processPrompt(req.body.Body, from);

  if (result == 2) {
    axios
      .post("https://fulkrum.atlassian.net/rest/api/2/issue", jiraIssue, {
        auth: {
          username: process.env.EMAIL,
          password: process.env.API_KEY,
        },
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        res.send(
          `<Response><Message>Issue created: ${response.data.key}</Message></Response>`
        );
      })
      .catch((error) => {
        res.send(
          `<Response><Message>Error creating issue: ${error.message}</Message></Response>`
        );
      });
  }
});

async function updateJiraIssueStatus(issueKey, status, from) {
  const jiraBaseUrl = process.env.JIRA_BASE_URL;
  const jiraUsername = process.env.EMAIL;
  const jiraApiToken = process.env.API_KEY;
  const jiraProjectKey = "IK"; // Assuming all your tasks are within the 'IK' project

  const url = `${jiraBaseUrl}/rest/api/2/issue/${issueKey}/transitions`;

  const auth = Buffer.from(`${jiraUsername}:${jiraApiToken}`).toString(
    "base64"
  );

  let transitionId;

  // Determine the transition ID based on the desired status
  if (status === "done") {
    transitionId = 31; // Replace with your actual transition ID for "Done"
  } else if (status === "progress") {
    transitionId = 21; // Replace with your actual transition ID for "In Progress"
  } else {
    console.error("Unknown status:", status);
    return;
  }

  try {
    const response = await axios.post(
      url,
      {
        transition: {
          id: transitionId,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        auth: {
          username: process.env.EMAIL,
          password: process.env.API_KEY,
        },
      }
    );
    console.log(`Issue ${issueKey} updated to ${status}`);
    replyToUser(`Issue ${issueKey} updated to ${status}`, from);
  } catch (error) {
    console.error(
      "Failed to update the JIRA issue:",
      error.response ? error.response.data : error.message
    );
    replyToUser(`Issue ${issueKey} failed updated to ${status}`, from);
  }
}

async function replyToUser(response, receiver) {
  client.messages
    .create({
      body: response,
      from: `whatsapp:+${process.env.TWILIO_NUMBER}`,
      to: `${receiver}`,
    })
    .then((message) => console.log(message.sid));
}

app.listen(9500, () => {
  console.log("Server is running on port 9500");
});
