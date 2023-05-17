import { S3Client, DeleteBucketCommand, DeleteObjectCommand, ListBucketsCommand, ListObjectVersionsCommand } from '@aws-sdk/client-s3';
import { CloudFormationClient, DeleteStackCommand, ListStacksCommand, StackSummary } from '@aws-sdk/client-cloudformation';
import { LambdaClient, DeleteFunctionCommand, ListFunctionsCommand } from '@aws-sdk/client-lambda';

const region = 'us-east-1';
const s3 = new S3Client({ region });
const cf = new CloudFormationClient({ region });
const lambda = new LambdaClient({ region });
const prefix = 'ask-';

const deleteBucket = async (name) => {
    const versions = await s3.send(new ListObjectVersionsCommand({ Bucket: name }));

    if (versions.Versions) {
        const deletePromises = versions.Versions.map(i => s3.send(new DeleteObjectCommand({ Bucket: name, Key: i.Key, VersionId: i.VersionId }))) || [];
        await Promise.all(deletePromises);
        const deleteMarkersPromises = versions.DeleteMarkers?.map(i => s3.send(new DeleteObjectCommand({ Bucket: name, Key: i.Key, VersionId: i.VersionId }))) || [];
        await Promise.all(deleteMarkersPromises);
    }

    return s3.send(new DeleteBucketCommand({ Bucket: name }));
};

export const cleanUp = async () => {
    console.log(`cleaning aws resources with prefix "${prefix}"`);

    const stackResults = await cf.send(new ListStacksCommand({})).then(res => {
        const stacks: StackSummary[] = res.StackSummaries?.filter(s => s.StackName?.startsWith(prefix) && !s.StackStatus?.includes('DELETE_COMPLETE')) || [];
        console.log('Stacks #:', stacks.length);
        const deletePromises = stacks.map(i => cf.send(new DeleteStackCommand({ StackName: i.StackName })));
        return Promise.allSettled(deletePromises);
    });

    const functionResults = await lambda.send(new ListFunctionsCommand({})).then(res => {
        const Functions = res.Functions?.filter(i => i.FunctionName?.startsWith(prefix)) || [];
        console.log('Functions #:', Functions.length);
        const deletePromises = Functions.map(i => lambda.send(new DeleteFunctionCommand({ FunctionName: i.FunctionName })));
        return Promise.allSettled(deletePromises);
    });

    const bucketResults = await s3.send(new ListBucketsCommand({})).then(async (res) => {
        const Buckets = res.Buckets?.filter(b => b.Name?.startsWith(prefix)) || [];
        console.log('Buckets #:', Buckets.length);
        const deletePromises = Buckets.map((i) => deleteBucket(i.Name));
        return Promise.allSettled(deletePromises);
    });

    const rejected = [...stackResults, ...functionResults, ...bucketResults].filter(r => r.status === 'rejected');
    if (rejected.length) {
        rejected.forEach(r => {
            console.error(JSON.stringify(r, null, 2));
        });
    }
    console.log('done');
};

cleanUp();
