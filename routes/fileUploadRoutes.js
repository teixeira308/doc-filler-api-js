// routes/fileUploadRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../config/dbConfig');
const fs = require('fs');
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const { authenticateToken } = require('../middleware/auth');

const fileUploadController = require('../controller/fileUploadController');



// Rota para upload de arquivo
router.post('/templates', authenticateToken, fileUploadController.uploadSingleFile, fileUploadController.UploadFile);

router.get('/fill-docx-template/:idtemplate/pessoa/:idpessoa', authenticateToken, fileUploadController.createFilledFile );

router.get('/templates/:userid', authenticateToken, fileUploadController.getTemplatesByUserId);

router.get('/templates/:userid/download', authenticateToken, fileUploadController.getTemplatesById);

router.delete('/templates/:id', authenticateToken, fileUploadController.deleteTemplateById);

router.put('/templates/:id', authenticateToken, fileUploadController.UpdateFile);


module.exports = router;
