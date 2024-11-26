const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const multerConfig = require('../middleware/multer-config');
const bookCtrl = require('../controllers/book');

// Route pour créer un livre
router.post('/', auth, multerConfig.upload, multerConfig.optimizeImage, bookCtrl.createBook); 
router.get('/', bookCtrl.findAllBooks);
router.get('/bestrating', bookCtrl.findBestRatedBooks);
router.put('/:id', auth, multerConfig.upload, multerConfig.optimizeImage, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);
router.get('/:id', bookCtrl.findOneBook);
router.post('/:id/rating', auth, bookCtrl.updateRating);

module.exports = router;
