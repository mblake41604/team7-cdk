import { readFile } from 'node:fs/promises';
import { PutCommand, DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { SES } from '@aws-sdk/client-ses';

/**
 * AWS Lambda function that returns an HTML page.
 *
 * @param {Object} event - The event object containing details about the request.
 * @returns {Object} The response object containing the HTML page.
 */

const dynamo = DynamoDBDocumentClient.from(new DynamoDB({ region: 'us-east-1' }));
const ses = new SES({ region: 'us-east-1' });
const senderEmail = "jweisbakery@gmail.com";

export const handler = async(event) => {
    console.log(event);
    
    if (event.queryStringParameters) {
        const recipEmail = event.queryStringParameters.email;
        await dynamo.send(new PutCommand({
            TableName: "team7_dynamo",
            Item: {
                PK: "form",
                SK: event.requestContext.requestId,
                form: event.queryStringParameters
            },
        }));
        await sendEmailConfirmation(recipEmail);
    }

    const html = await readFile('index.html', { encoding: 'utf8' });
    const modifiedHTML = dynamicForm(html, event.queryStringParameters);
    const params = {
        TableName: "team7_dynamo",
        KeyConditionExpression: "PK = :PK",
        ExpressionAttributeValues: {
            ":PK": "form"
        }
    };

    const queryCommand = new QueryCommand(params);
    const queryResult = await dynamo.send(queryCommand);
    console.log("DynamoDB query operation result:", JSON.stringify(queryResult, null, 2));
    const newmodifiedHTML = dynamictable(modifiedHTML, queryResult);
    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html',
        },
        body: newmodifiedHTML,
    };

    return response;
};

function dynamicForm(html, queryStringParameters) {
    let formres = '';
    if (queryStringParameters) {
        Object.values(queryStringParameters).forEach(val => {
            formres = formres + val + ' ';
        });
    }
    return html.replace('{formResults}', '<h4>Form Submission: ' + formres + '</h4>');
}

function dynamictable(html, tableQuery) {
    let table = '';
    if (tableQuery.Items.length > 0) {
        for (let i = 0; i < tableQuery.Items.length; i++) {
            table = table + "<li>" + JSON.stringify(tableQuery.Items[i]) + "</li>";
        }
        table = "<pre>" + table + "</pre>";
    }
    return html.replace("{table}", "<h4>DynamoDB:</h4>" + table);
}

async function sendEmailConfirmation(recipientEmail) {
    const emailParams = {
      Destination: {
        ToAddresses: [recipientEmail],
      },
      Message: {
        Body: {
          Text: { Data: "Thank you for submitting the form!" },
        },
        Subject: { Data: "Form Submission Confirmation" },
      },
      Source: senderEmail,
    };
  
    try {
      const result = await ses.sendEmail(emailParams);
      console.log("Email sent successfully:", result);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }