import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folderName = 'noore-imperial/misc';
    
    // Determine folder based on route or fieldname
    if (file.fieldname === 'avatar') folderName = 'noore-imperial/avatars';
    else if (file.fieldname === 'images' || req.baseUrl.includes('products')) folderName = 'noore-imperial/products';
    else if (req.baseUrl.includes('consultations')) folderName = 'noore-imperial/consultations';
    else if (req.baseUrl.includes('lectures')) folderName = 'noore-imperial/lectures';
    else if (req.baseUrl.includes('assignments')) folderName = 'noore-imperial/assignments';
    else if (req.baseUrl.includes('certificates')) folderName = 'noore-imperial/certificates';

    return {
      folder: folderName,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'mp4'],
      resource_type: 'auto'
    };
  },
});

const upload = multer({ storage: storage });

export const uploadSingle = (fieldName) => upload.single(fieldName);
export const uploadArray = (fieldName, maxCount) => upload.array(fieldName, maxCount);
export const uploadFields = (fields) => upload.fields(fields);
