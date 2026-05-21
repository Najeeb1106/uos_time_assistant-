const { db } = require('../config/firebase');
const { extractSchedule } = require('../utils/pdfParser');

/**
 * Handle PDF Timetable upload and parse it server-side
 */
exports.uploadSchedule = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded.'
      });
    }

    const uid = req.user.uid;

    // Fetch user profile to get batch, semester, and type
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(400).json({
        success: false,
        message: 'Student profile not found. Please complete registration.'
      });
    }

    const user = userDoc.data();
    console.log(`Parsing PDF for student profile: Sem ${user.semester}, ${user.type}, Batch: ${user.batch}`);

    // Call our coordinate-based parser
    const parsedClasses = await extractSchedule(
      req.file.buffer,
      user.batch,
      user.semester,
      user.type
    );

    return res.status(200).json({
      success: true,
      message: `Parsed ${parsedClasses.length} matching schedule lectures successfully.`,
      classes: parsedClasses,
      pdfFileName: req.file.originalname
    });

  } catch (error) {
    console.error('Upload & Parsing Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while parsing the timetable PDF.'
    });
  }
};

/**
 * Save / Confirm parsed schedule to user account
 */
exports.saveSchedule = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { classes, pdfFileName } = req.body;

    console.log(`[ScheduleController] Saving schedule for uid: ${uid}, pdfFileName: ${pdfFileName}, classes count: ${classes ? (Array.isArray(classes) ? classes.length : typeof classes) : 'undefined'}`);

    if (!Array.isArray(classes)) {
      console.warn(`[ScheduleController] Save failed: classes is not an array. Received:`, typeof classes);
      return res.status(400).json({
        success: false,
        message: 'Invalid schedule classes format.'
      });
    }

    const scheduleData = {
      uid,
      classes,
      pdfFileName: pdfFileName || 'custom_timetable.pdf',
      uploadedAt: new Date().toISOString()
    };

    // Save schedule data
    await db.collection('schedules').doc(uid).set(scheduleData);

    // Fetch latest user document to append to historical updates if needed
    // (Local mock database works cleanly with these documents)

    return res.status(200).json({
      success: true,
      message: 'Timetable saved successfully.',
      schedule: scheduleData
    });

  } catch (error) {
    console.error('Save Schedule Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save timetable to your account.'
    });
  }
};

/**
 * Fetch latest schedule for current authenticated student
 */
exports.getCurrentSchedule = async (req, res) => {
  try {
    const uid = req.user.uid;
    const scheduleDoc = await db.collection('schedules').doc(uid).get();

    if (!scheduleDoc.exists) {
      return res.status(200).json({
        success: true,
        classes: [],
        pdfFileName: null,
        uploadedAt: null
      });
    }

    const data = scheduleDoc.data();
    return res.status(200).json({
      success: true,
      classes: data.classes || [],
      pdfFileName: data.pdfFileName || null,
      uploadedAt: data.uploadedAt || null
    });

  } catch (error) {
    console.error('GetCurrentSchedule Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve active timetable.'
    });
  }
};

/**
 * Update the schedule classes directly (adds, edits, or deletes in bulk)
 */
exports.updateScheduleClasses = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { classes } = req.body;

    if (!Array.isArray(classes)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid schedule data. Must be an array of classes.'
      });
    }

    const scheduleDoc = await db.collection('schedules').doc(uid).get();
    let currentSchedule = scheduleDoc.exists ? scheduleDoc.data() : {
      uid,
      pdfFileName: 'manual_timetable.pdf',
      uploadedAt: new Date().toISOString()
    };

    currentSchedule.classes = classes;
    currentSchedule.updatedAt = new Date().toISOString();

    await db.collection('schedules').doc(uid).set(currentSchedule);

    return res.status(200).json({
      success: true,
      message: 'Classes updated successfully.',
      classes: currentSchedule.classes
    });

  } catch (error) {
    console.error('UpdateClasses Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update schedule classes.'
    });
  }
};

/**
 * Clear schedule data completely
 */
exports.deleteSchedule = async (req, res) => {
  try {
    const uid = req.user.uid;
    await db.collection('schedules').doc(uid).delete();

    return res.status(200).json({
      success: true,
      message: 'Timetable cleared from user account.'
    });

  } catch (error) {
    console.error('DeleteSchedule Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear timetable.'
    });
  }
};
