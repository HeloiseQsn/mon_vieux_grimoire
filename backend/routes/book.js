const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

const bookCtrl = require('../controllers/book');

router.post('/', auth, multer, bookCtrl.createBook);
router.get('/', bookCtrl.findAllBooks);
router.get('/bestrating', bookCtrl.findBestRatedBooks);
router.put('/:id', auth, multer, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);
router.get('/:id', bookCtrl.findOneBook);
router.post('/:id/rating', auth, bookCtrl.updateRating);

module.exports = router;
