const { Stack, CfnOutput, RemovalPolicy } = require('aws-cdk-lib');
const lambda = require('aws-cdk-lib/aws-lambda');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const iam = require('aws-cdk-lib/aws-iam');

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

    myBakeryFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    }));

    // function url for http page
    const myBakeryFunctionUrl = myBakeryFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    new CfnOutput(this, "myBakeryFunctionUrlOutput", {
      value: myBakeryFunctionUrl.url,
    });

  }
}

module.exports = { Team7CdkStack }
