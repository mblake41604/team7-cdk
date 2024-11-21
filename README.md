# Team 7 Resume Reader

This project creates an HTTP serverless web application through AWS API Gateway, where users can apply to jWeis's Bread Bakery. When users submit the form, it triggers an AWS Lambda function, which sends the information to AWS DynamoDB table. This is where the company can review applicants, with each applicant's information as its own item in the table. As well, the Lambda function will trigger AWS Simple Email Service (SES) to send a confirmation email to the applicant that their application was submitted. This project has can have a fully automated deployment through AWS CDK.

## lib/team7-cdk-stack.js

This file defines our CDK stack and resources using AWS CDK L2 constructs. We define the DynamoDB table and the Lambda function that points to the lambda directory for definition.

We use an HTTP API Gateway, which creates a URL to access the web application after deployment. Whenever a request comes through the API Gateway, it is sent to the Lambda function. We create a route that accepts GET requests, as this method is used for our form in the html page. 

For security, our Lambda function has an execution role. And we add IAM policies to secure it. We allow the Lambda function only to retrieve and write data to the specific DynamoDB table using Query and PutItem. We allow the Lambda function to send emails using AWS SES to any recipient. And we grant the API Gateway permission to invoke the Lambda function.

## lambda/index.mjs

## Scripts to run project

* `cdk synth`        emits the synthesized CloudFormation template
* `cdk diff`         compare deployed stack with current state
* `cdk deploy`       deploy this stack to your default AWS account/region
                     copy and paste the HttpApiUrl into a web browser to access the web page
* `cdk destroy`      destorys this stack and associated service