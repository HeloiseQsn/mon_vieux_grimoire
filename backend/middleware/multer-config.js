const multer = require('multer'); //pour le téléchargement des fichiers


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


module.exports = multer({storage: storage}).single('image');
