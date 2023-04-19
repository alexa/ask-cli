const { S3Client, DeleteBucketCommand, DeleteObjectCommand, ListBucketsCommand, ListObjectVersionsCommand } = require('@aws-sdk/client-s3');
const { CloudFormationClient, DeleteStackCommand, ListStacksCommand } = require('@aws-sdk/client-cloudformation');
const { LambdaClient, DeleteFunctionCommand, ListFunctionsCommand } = require('@aws-sdk/client-lambda');

const region = 'us-east-1';

const s3 = new S3Client({ region });
const cf = new CloudFormationClient({ region });
const lambda = new LambdaClient({ region });

const prefix = 'ask-';

const deleteBucket = async (name) => {
    const versions = await s3.send(new ListObjectVersionsCommand({ Bucket: name }));

    let deletePromises = versions.Versions.map(i => s3.send(new DeleteObjectCommand({ Bucket: name, Key: i.Key, VersionId: i.VersionId })));
    await Promise.all(deletePromises);

    deletePromises = versions.DeleteMarkers.map(i => s3.send(new DeleteObjectCommand({ Bucket: name, Key: i.Key, VersionId: i.VersionId })));
    await Promise.all(deletePromises);

    return s3.send(new DeleteBucketCommand({ Bucket: name }));
};

const cleanUp = async () => {
    console.log(`cleaning aws resources with prefix "${prefix}"`);

    const stackResults = await cf.send(new ListStacksCommand()).then(res => {
        const Stacks = res.StackSummaries
            .filter(s => s.StackName.startsWith(prefix) && !s.StackStatus.includes('DELETE_COMPLETE'));
        console.log('Stacks #:', Stacks.length);
        const deletePromises = Stacks.map(i => cf.send(new DeleteStackCommand({ StackName: i.StackName })));
        return Promise.allSettled(deletePromises);
    });

    const functionResults = await lambda.send(new ListFunctionsCommand()).then(res => {
        const Functions = res.Functions.filter(i => i.FunctionName.startsWith(prefix));
        console.log('Functions #:', Functions.length);
        const deletePromises = Functions.map(i => lambda.send(new DeleteFunctionCommand({ FunctionName: i.FunctionName })));
        return Promise.allSettled(deletePromises);
    });

    const bucketResults = await s3.send(new ListBucketsCommand()).then(async (res) => {
        const Buckets = res.Buckets.filter(b => b.Name.startsWith(prefix));
        console.log('Buckets #:', Buckets.length);
        const deletePromises = Buckets.map((i) => deleteBucket(i.Name));
        return Promise.allSettled(deletePromises);
    });

    const rejected = [...stackResults, ...functionResults, ...bucketResults].filter(r => r.status === 'rejected');
    if (rejected.length) {
        rejected.forEach(r => {
            console.error(r.reason);
        });
    }
    console.log('done');
};

cleanUp();
