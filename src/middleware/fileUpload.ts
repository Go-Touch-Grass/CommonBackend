import multer from "multer";
import path from "path";
import fs from "fs";
//Multer is a middleware for handling multipart/form-data requests, specifically designed for file uploads in Node.js.

const proofBusinessUploadDir = "C://GoTouchGrass//uploads//proofOfBusiness";
const profileImageUploadDir = "C://GoTouchGrass//uploads//profileImages";
const avatarUploadDir = "C://GoTouchGrass//uploads//avatarModels";

// Ensure the directory exists
if (!fs.existsSync(proofBusinessUploadDir)) {
  fs.mkdirSync(proofBusinessUploadDir, { recursive: true }); // Create the directory if it doesn't exist
}
// Ensure the directory exists
if (!fs.existsSync(profileImageUploadDir)) {
  fs.mkdirSync(profileImageUploadDir, { recursive: true }); // Create the directory if it doesn't exist
}

// Ensure the directory exists
if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true }); // Create the directory if it doesn't exist
}

// storage for proof of business
const proofBusinessStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the directory exists each time (not strictly necessary after the initial check)
    if (!fs.existsSync(proofBusinessUploadDir)) {
      fs.mkdirSync(proofBusinessUploadDir, { recursive: true });
    }
    cb(null, proofBusinessUploadDir); // uploaded files will be stored in this directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique filename with original extension
    // cb(null, new Date().valueOf() + '-' + file.originalname);
  },
});

// storage for profile images
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileImageUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// storage for avatar files
const avatarFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Multer filter to allow only image or PDF files
const proofBusinessfileFilter = (req: any, file: any, cb: any) => {
  const fileTypes = /jpeg|jpg|png|pdf/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = fileTypes.test(file.mimetype);

  if (mimeType && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only .png, .jpg, .jpeg, and .pdf formats are allowed!"));
  }
};

// Multer filter to allow only image or PDF files
const profileImagefileFilter = (req: any, file: any, cb: any) => {
  const fileTypes = /jpeg|jpg|png/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = fileTypes.test(file.mimetype);

  if (mimeType && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only .png, .jpg, .jpeg formats are allowed!"));
  }
};

// Multer filter to allow only .glb files
const avatarfileFilter = (req: any, file: any, cb: any) => {
  // Check the file extension
  const extname = path.extname(file.originalname).toLowerCase() === ".glb";

  // Optional: If you still want to check the MIME type
  const mimeType =
    file.mimetype === "model/gltf-binary" ||
    file.mimetype === "application/octet-stream";

  // If either the extension or MIME type is valid, allow the upload
  if (extname && (mimeType || !file.mimetype)) {
    return cb(null, true);
  } else {
    cb(new Error("Only .glb formats are allowed!"));
  }
};

const proofBusinessUpload = multer({
  storage: proofBusinessStorage,
  fileFilter: proofBusinessfileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Set file size limit to 5MB
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  fileFilter: profileImagefileFilter, //TO CHANGE
  limits: { fileSize: 5 * 1024 * 1024 },
});

const avatarFileUpload = multer({
  storage: avatarFileStorage,
  fileFilter: avatarfileFilter, //TO CHANGE
});

export { profileImageUpload, avatarFileUpload }; // For profile image upload

export default proofBusinessUpload; // For proof of business

/*
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'C://GoTouchGrass//uploads'); // uploaded files will be stored in this directory
        },
        filename: function (req, file, cb) {
            cb(null, new Date().valueOf() + '-' + file.originalname);
        }
    }),
});
*/
