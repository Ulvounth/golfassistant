import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/**
 * Stack for S3 storage
 */
export class StorageStack extends cdk.Stack {
  public readonly profileBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for profilbilder
    this.profileBucket = new s3.Bucket(this, 'ProfileImagesBucket', {
      bucketName: 'golftracker-profiles',
      publicReadAccess: true, // Tillat offentlig lesing
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['*'], // I produksjon: begrens til faktisk domene
          allowedHeaders: ['*'],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Behold bucket ved sletting av stack
      autoDeleteObjects: false,
    });

    // Output
    new cdk.CfnOutput(this, 'ProfileBucketName', {
      value: this.profileBucket.bucketName,
      description: 'Name of the S3 bucket for profile images',
    });

    new cdk.CfnOutput(this, 'ProfileBucketUrl', {
      value: this.profileBucket.bucketWebsiteUrl,
      description: 'URL of the S3 bucket',
    });
  }
}
