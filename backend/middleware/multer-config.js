const multer = require('multer'); // pour le téléchargement des fichiers
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

const storage = multer.memoryStorage(); // Utilisation de la mémoire pour le stockage initial

const upload = multer({ storage: storage }).single('image');

module.exports = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return next();
    }

    try {
      const name = req.file.originalname.split(' ').join('_');
      const extension = MIME_TYPES[req.file.mimetype];
      const filename = `${name}${Date.now()}.${extension}`;

      // Chemin pour sauvegarder l'image redimensionnée
      const outputPath = path.join(__dirname, '..', 'images', filename);

      // Redimensionnement de l'image avec Sharp
      await sharp(req.file.buffer)
        .resize(800, null) // Redimensionne l'image à 800 en largeur
        .toFile(outputPath);

      // Ajout du chemin de l'image redimensionnée à la requête pour l'utiliser dans le contrôleur
      req.file.filename = filename;

      next();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
};
