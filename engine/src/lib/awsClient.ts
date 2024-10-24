import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

async function uploadJsonToS3(jsonData: JSON) {
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
    const response = await s3Client.send(command);

    console.log(`Successfully uploaded data to ${bucket}/${fileName}`);
    return response;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}
