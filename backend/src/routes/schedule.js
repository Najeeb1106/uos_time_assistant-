const express = require('express');
const router = express.Router();
const multer = require('multer');
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/auth');

// Multer memory storage configuration for PDF and image timetable uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname);
    const isImage = /^(image\/(jpeg|png|webp))$/i.test(file.mimetype) || /\.(jpe?g|png|webp)$/i.test(file.originalname);

    if (isPdf || isImage) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Only PDF, JPEG, PNG, and WebP files are supported!'), false);
    }
  }
});

// Protect all schedule routes with our auth middleware
router.use(authMiddleware);

// Routes
router.post('/upload', upload.single('file'), scheduleController.uploadSchedule);
router.post('/', scheduleController.saveSchedule);
router.get('/current', scheduleController.getCurrentSchedule);
router.get('/global', scheduleController.getGlobalSchedule);
router.put('/', scheduleController.updateScheduleClasses);
router.delete('/', scheduleController.deleteSchedule);

module.exports = router;
