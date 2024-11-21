const { Stack, CfnOutput, RemovalPolicy } = require('aws-cdk-lib');
const lambda = require('aws-cdk-lib/aws-lambda');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const iam = require('aws-cdk-lib/aws-iam');
const apigateway = require('aws-cdk-lib/aws-apigatewayv2');
const apigatewayIntegrations = require('aws-cdk-lib/aws-apigatewayv2-integrations');

class Team7CdkStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

  // create dynamoDB table to store applicant submissions
  const table = new dynamodb.Table(this, 'team7_dynamo', {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      tableName: 'team7_dynamo',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const myBakeryFunction = new lambda.Function(this, 'MyBakeryFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('./lambda'), // points to the lambda directory
      handler: 'index.handler', // points to index.mjs in lambda directory
    });

    // Query and putItem policy
    myBakeryFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:Query', 'dynamodb:PutItem'],
      resources: [
        'arn:aws:dynamodb:us-east-1:620339869704:table/team7_dynamo',
      ],
    }));

    // email policy
    myBakeryFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    }));

    // http api gateway
    const httpApi = new apigateway.HttpApi(this, 'BakeryHttpApi', {
      defaultIntegration: new apigatewayIntegrations.HttpLambdaIntegration('LambdaIntegration', myBakeryFunction),
    });

    // /application route with GET method
    httpApi.addRoutes({
      path: '/application',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('LambdaIntegration', myBakeryFunction),
    });

    // api gateway invoke lambda permission
    myBakeryFunction.addPermission('ApiGatewayInvokePermission', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `${httpApi.arnForExecuteApi()}/*/*/*`,
    });

    // api url
    new CfnOutput(this, 'BakeryHttpApiUrl', {
      value: httpApi.url,
    });
  }
}

module.exports = { Team7CdkStack }
