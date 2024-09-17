import multer from 'multer';
import path from 'path';

//Multer is a middleware for handling multipart/form-data requests, specifically designed for file uploads in Node.js.

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'C://GoTouchGrass//uploads'); // uploaded files will be stored in this directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique filename with original extension
        // cb(null, new Date().valueOf() + '-' + file.originalname);
    }
});

// Multer filter to allow only image or PDF files
const fileFilter = (req: any, file: any, cb: any) => {
    const fileTypes = /jpeg|jpg|png|pdf/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (mimeType && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only .png, .jpg, .jpeg, and .pdf formats are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Set file size limit to 5MB
});


export default upload;

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
