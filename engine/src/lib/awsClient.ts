import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

interface S3Config {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

interface S3Response {
  success: boolean;
  data?: any;
  error?: Error;
}

const s3ClientConfig: S3Config = {
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

// S3 Service class
export class S3Service {
  private s3Client: S3Client;
  static instance: S3Service;

  static getInstance(config: S3Config) {
    if (!this.instance) {
      this.instance = new S3Service(config);
    }
    return this.instance;
  }

  constructor(config: S3Config) {
    this.s3Client = new S3Client(config);
  }

  async uploadJsonToS3(jsonData: any): Promise<S3Response> {
    try {
      const bucket = "probo-snapshot";
      const fileName = "snapshot.json";
      // Convert JSON to string
      const jsonString = JSON.stringify(jsonData, null, 2);

      // Prepare the upload parameters
      const uploadParams = {
        Bucket: "probo-snapshot",
        Key: "/probosnapshot.json",
        Body: jsonString,
        ContentType: "application/json",
      };

      // Upload to S3
      const command = new PutObjectCommand(uploadParams);
      const response = await this.s3Client.send(command);

      console.log(`Successfully uploaded data to ${bucket}/${fileName}`);
      return { success: true, data: response };
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw error;
    }
  }

  async fetchJson(): Promise<S3Response> {
    try {
      const bucketName = "probo-snapshot";
      const fileName = "snapshot.json";
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error("Empty response body");
      }

      console.log("response", response);

      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      console.error("Error fetching from S3:", error);
      return {
        success: false,
        error: error?.message,
      };
    }
  }
}

export const s3Service = S3Service.getInstance(s3ClientConfig);
