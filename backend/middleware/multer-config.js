const multer = require('multer'); //pour le téléchargement des fichiers
const shark = require('shark'); //pour optimiser les images

// Définition des types MIME et des extensions correspondantes
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

const storage = multer.diskStorage({ // Configuration de stockage des images
  destination: (req, file, callback) => {
    callback(null, 'images');  // Répertoire de stockage
  },
  // Génération nom unique pour chaque fichier
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);  // Nom unique => name+temps écoulé depuis le 1er janvier 1970 en ms + . + extension
  }
});

const upload = multer({ storage: storage }).single('image'); // Configuration de multer pour le téléchargement de fichiers : on indique qu'on n'accepte qu'une image 


const optimizeImage = (req, res, next) => {
  if (req.file) { 
    const imagePath = `images/${req.file.filename}`; 

    shark.optimize(imagePath) //si on a un fichier dans la requête, on optimise l'image avec shark
      .then(() => {
        console.log(`Image ${imagePath} optimisée avec succès.`);  // Message de succès
        next();
      })
      .catch(error => {
        res.status(500).json({ error });
      });
  } else {
    next();
  }
};

module.exports = { upload, optimizeImage };
