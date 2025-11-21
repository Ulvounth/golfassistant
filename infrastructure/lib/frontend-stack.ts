import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

interface FrontendStackProps extends cdk.StackProps {
  domainName?: string;
  certificateArn?: string;
}

/**
 * Stack for hosting React frontend via S3 + CloudFront
 *
 * Features:
 * - S3 bucket for static files (private)
 * - CloudFront CDN for global distribution
 * - HTTPS with custom domain support
 * - SPA routing support (redirects to index.html)
 * - Automatic cache invalidation on deploy
 */
export class FrontendStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: FrontendStackProps) {
    super(scope, id, props);

    // S3 Bucket for frontend (private bucket with CloudFront access only)
    this.bucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `golftracker-frontend-${this.account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true, // Enable versioning for rollback capability
    });

    // CloudFront Origin Access Identity
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: 'OAI for GolfTracker website',
    });

    this.bucket.grantRead(oai);

    // Certificate (if custom domain)
    let certificate;
    if (props?.certificateArn) {
      certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', props.certificateArn);
    }

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      // SPA routing: redirect 404/403 to index.html
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      domainNames: props?.domainName ? [props.domainName] : undefined,
      certificate: certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // North America & Europe (most cost-effective)
      enableLogging: true,
      comment: 'GolfTracker Frontend Distribution',
    });

    // Deploy frontend files to S3 (if dist/ folder exists)
    // Note: Run 'npm run build' in frontend/ before deploying
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('../frontend/dist')],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
      prune: true, // Remove old files
      memoryLimit: 512,
    });

    // Route53 alias (if custom domain)
    if (props?.domainName) {
      const zone = route53.HostedZone.fromLookup(this, 'Zone', {
        domainName: props.domainName.split('.').slice(-2).join('.'), // Get root domain
      });

      new route53.ARecord(this, 'AliasRecord', {
        zone,
        recordName: props.domainName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
      });

      // IPv6 support
      new route53.AaaaRecord(this, 'AliasRecordIpv6', {
        zone,
        recordName: props.domainName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 bucket name for frontend',
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
      exportName: 'GolfTrackerFrontendDomain',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID (for cache invalidation)',
      exportName: 'GolfTrackerDistributionId',
    });

    if (props?.domainName) {
      new cdk.CfnOutput(this, 'WebsiteUrl', {
        value: `https://${props.domainName}`,
        description: 'Website URL',
      });
    } else {
      new cdk.CfnOutput(this, 'WebsiteUrl', {
        value: `https://${this.distribution.distributionDomainName}`,
        description: 'Website URL (CloudFront domain)',
      });
    }
  }
}
