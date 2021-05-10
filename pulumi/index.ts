import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

const stackName = pulumi.getStack();
const projectName = pulumi.getProject();
const getName = (name: string) => {
  return `${stackName}-${projectName}-${name}`;
};

const dynamoConfig = new pulumi.Config('dynamo');
const netlifyConfig = new pulumi.Config('netlify');

const dynamoTableName = getName('shopsTable');

const newShopTopic = new aws.sns.Topic(getName('newShopTopic'));
const shopsDynamoDbTable = new aws.dynamodb.Table(dynamoTableName, {
  name: dynamoTableName,
  attributes: [
    {
      name: 'id',
      type: 'S',
    },
  ],
  hashKey: 'id',
  billingMode: 'PROVISIONED',
  readCapacity: 1,
  writeCapacity: 1,
  tags: {
    Environment: pulumi.getStack(),
  },
});

const defaultLambdaRole = new aws.iam.Role(
  getName('triggerDeployHandlerRole'),
  {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
      Service: 'lambda.amazonaws.com',
    }),
  }
);

const executionRole = new aws.iam.Role(getName('executionRole'), {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: 'lambda.amazonaws.com',
  }),
});

const executionRolePolicyName = `${getName('executionRole')}-policy`;
const rolePolicy = new aws.iam.RolePolicy(executionRolePolicyName, {
  name: executionRolePolicyName,
  role: executionRole,
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['dynamodb:Query', 'dynamodb:Scan', 'dynamodb:PutItem'],
        Resource: shopsDynamoDbTable.arn,
      },
      {
        Effect: 'Allow',
        Action: ['SNS:Publish'],
        Resource: newShopTopic.arn,
      },
    ],
  },
});

const nodeModulesLayerName = getName('lambdaLayerNodeModules');
const nodeModuleLambdaLayer = new aws.lambda.LayerVersion(
  nodeModulesLayerName,
  {
    compatibleRuntimes: [aws.lambda.NodeJS12dXRuntime],
    code: new pulumi.asset.FileArchive('./layers/archive.zip'),
    layerName: nodeModulesLayerName,
  }
);

const getShopsHandler = new aws.lambda.Function(
  getName('getShopsHandler'),
  {
    role: executionRole.arn,
    handler: 'index.handler',
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive('./build/functions/get-shops'),
    }),
    runtime: aws.lambda.NodeJS12dXRuntime,
    layers: [nodeModuleLambdaLayer.arn],
    environment: {
      variables: {
        DYNAMO_TABLE_NAME: dynamoTableName,
      },
    },
  },
  {}
);

const createShopHandler = new aws.lambda.Function(
  getName('postShopHandler'),
  {
    role: executionRole.arn,
    handler: 'index.handler',
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive('./build/functions/post-shop'),
    }),
    runtime: aws.lambda.NodeJS12dXRuntime,
    layers: [nodeModuleLambdaLayer.arn],
    environment: {
      variables: {
        DYNAMO_TABLE_NAME: dynamoTableName,
        SNS_TOPIC_ARN: newShopTopic.arn,
        AUTHORIZATION: dynamoConfig.requireSecret('auth'),
      },
    },
  },
  {}
);

const triggerDeployHandler = new aws.lambda.Function(
  getName('triggerDeployLambda'),
  {
    role: defaultLambdaRole.arn,
    handler: 'index.handler',
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive('./build/functions/trigger-deploy'),
    }),
    runtime: aws.lambda.NodeJS12dXRuntime,
    layers: [nodeModuleLambdaLayer.arn],
    environment: {
      variables: {
        NETLIFY_DEPLOY_URL: netlifyConfig.requireSecret('deployUrl'),
      },
    },
  },
  {}
);

const withSnsPermission = new aws.lambda.Permission(
  getName('withSnsPermission'),
  {
    action: 'lambda:InvokeFunction',
    function: triggerDeployHandler.name,
    principal: 'sns.amazonaws.com',
    sourceArn: newShopTopic.arn,
  }
);
const newShopTopicSubscription = new aws.sns.TopicSubscription(
  getName('newShopTopicSubscription'),
  {
    topic: newShopTopic,
    protocol: 'lambda',
    endpoint: triggerDeployHandler.arn,
  }
);

const api = new awsx.apigateway.API(getName('apiGateway'), {
  stageName: stackName,
  routes: [
    {
      path: '/shops',
      method: 'GET',
      eventHandler: aws.lambda.Function.get(
        getName('getShopsGatewayHandler'),
        getShopsHandler.arn
      ),
    },
    {
      path: '/shops',
      method: 'POST',
      eventHandler: aws.lambda.Function.get(
        getName('createShopGatewayHandler'),
        createShopHandler.arn
      ),
    },
    {
      path: '/shops',
      method: 'OPTIONS',
      eventHandler: async () => ({
        headers: {
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        },
        statusCode: 200,
        body: '',
      }),
    },
  ],
});

// Export the auto-generated API Gateway base URL.
export const url = api.url;
export const topicArn = newShopTopic.arn;
export const dynamoArn = shopsDynamoDbTable.arn;
