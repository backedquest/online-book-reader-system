const express = require('express');
const multer = require('multer');
const { bucket } = require('../config/firebase/firebaseConfig');
const Book = require('../models/Book');
const router = express.Router();

// Configure Multer for file handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/books - Add new book
router.post('/', upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, author, description } = req.body;
    
    if (!req.files.pdf) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    // Upload PDF
    const pdfFile = req.files.pdf[0];
    const pdfFileName = `books/pdf/${Date.now()}_${pdfFile.originalname}`;
    const pdfBlob = bucket.file(pdfFileName);
    
    await pdfBlob.save(pdfFile.buffer, {
      metadata: { contentType: pdfFile.mimetype }
    });

    // Upload cover image if exists
    let coverUrl = '';
    if (req.files.cover) {
      const coverFile = req.files.cover[0];
      const coverFileName = `books/covers/${Date.now()}_${coverFile.originalname}`;
      const coverBlob = bucket.file(coverFileName);
      
      await coverBlob.save(coverFile.buffer, {
        metadata: { contentType: coverFile.mimetype }
      });
      
      coverUrl = `https://storage.googleapis.com/${bucket.name}/${coverFileName}`;
    }

    // Generate signed URL for PDF (expires in 1 year)
    const [pdfUrl] = await pdfBlob.getSignedUrl({
      action: 'read',
      expires: '01-01-2025'
    });

    // Save to MongoDB
    const newBook = new Book({
      title,
      author,
      description,
      pdfUrl,
      coverUrl,
      storagePath: pdfFileName,
      createdAt: new Date()
    });

    await newBook.save();

    res.status(201).json(newBook);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;