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

// lambda triggers email sent through ses
async function sendEmailConfirmation(recipientEmail) {
    const emailParams = {
        Destination: {
          ToAddresses: [recipientEmail],
        },
        Message: {
          Body: {
            Text: { Data: `Thank you for your interest in joining jWeis's Bread Bakery team! Your application means a lot to us and we’re excited to learn more about your love for break-making and the unique touch you’ll add to our growing team!
  
We are deeply committed to crafting a warm and inviting space where we can bake our artisanal bread and pastries with care and passion. As such we will be reviewing your application shortly, with care, and will get back to you regarding the next steps. In the mean time, drop by and get a loaf of sourdough bread on us!
  
  Warm Regards,
  The JWeis's Bread Bakery Team` },
          },
          Subject: { Data: "Thank You for Your Interest in JWeis's Bread Bakery!" },
        },
        Source: senderEmail,
      }; 
  
    try {
      const result = await ses.sendEmail(emailParams);
      console.log("Email sent:", result);
    } catch (error) {
      console.error("Email error:", error);
    }
  }