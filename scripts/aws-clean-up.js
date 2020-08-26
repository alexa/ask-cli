const AWS = require('aws-sdk');

const region = 'us-east-1';

const s3 = new AWS.S3();
const cf = new AWS.CloudFormation({ region });
const lambda = new AWS.Lambda({ region });

const prefix = 'ask-';

const deleteBucket = async (name) => {
    const versions = await s3.listObjectVersions({ Bucket: name }).promise();

    let deletePromises = versions.Versions.map(i => s3.deleteObject({ Bucket: name, Key: i.Key, VersionId: i.VersionId }).promise());
    await Promise.all(deletePromises);

    deletePromises = versions.DeleteMarkers.map(i => s3.deleteObject({ Bucket: name, Key: i.Key, VersionId: i.VersionId }).promise());
    await Promise.all(deletePromises);

    return s3.deleteBucket({ Bucket: name }).promise();
};

const cleanUp = async () => {
    console.log(`cleaning aws resources with prefix "${prefix}"`);

    const stackResults = await cf.listStacks().promise().then(res => {
        const Stacks = res.StackSummaries
            .filter(s => s.StackName.startsWith(prefix) && !s.StackStatus.includes('DELETE_COMPLETE'));
        console.log('Stacks #:', Stacks.length);
        const deletePromises = Stacks.map(i => cf.deleteStack({ StackName: i.StackName }).promise());
        return Promise.allSettled(deletePromises);
    });

    const functionResults = await lambda.listFunctions().promise().then(res => {
        const Functions = res.Functions.filter(i => i.FunctionName.startsWith(prefix));
        console.log('Functions #:', Functions.length);
        const deletePromises = Functions.map(i => lambda.deleteFunction({ FunctionName: i.FunctionName }).promise());
        return Promise.allSettled(deletePromises);
    });

    const bucketResults = await s3.listBuckets().promise().then(async (res) => {
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
