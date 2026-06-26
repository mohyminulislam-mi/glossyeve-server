const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WEBP image files are allowed.'), false);
  }
};

const createUploadMiddleware = ({
  folder,
  limits = { fileSize: 5 * 1024 * 1024 },
  fieldName = 'image',
  multiple = false,
  maxCount = 10
} = {}) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: folder || 'aonelube/default',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: `${Date.now()}-${file.originalname.split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    }),
  });

  const upload = multer({
    storage,
    fileFilter,
    limits,
  });

  return multiple ? upload.array(fieldName, maxCount) : upload.single(fieldName);
};

module.exports = createUploadMiddleware;
