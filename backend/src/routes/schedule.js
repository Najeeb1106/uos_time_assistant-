const express = require('express');
const router = express.Router();
const multer = require('multer');
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/auth');

// Multer memory storage configuration for PDF files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported!'), false);
    }
  }
});

// Protect all schedule routes with our auth middleware
router.use(authMiddleware);

// Routes
router.post('/upload', upload.single('file'), scheduleController.uploadSchedule);
router.post('/', scheduleController.saveSchedule);
router.get('/current', scheduleController.getCurrentSchedule);
router.put('/', scheduleController.updateScheduleClasses);
router.delete('/', scheduleController.deleteSchedule);

module.exports = router;
