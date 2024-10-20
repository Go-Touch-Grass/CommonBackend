import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (!cloudinaryUrl) {
  throw new Error('CLOUDINARY_URL is not defined in the environment variables');
}

// Extract the cloud name, api key, and api secret from the URL
const match = cloudinaryUrl.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);

if (!match) {
  throw new Error('Invalid CLOUDINARY_URL format');
}

const [, api_key, api_secret, cloud_name] = match;

cloudinary.config({
  cloud_name,
  api_key,
  api_secret
});

export default cloudinary;
