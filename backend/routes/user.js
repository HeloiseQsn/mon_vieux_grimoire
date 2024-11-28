const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');

router.post('/signup', userCtrl.signup); // Si requête POST envoyée à "/signup", appeler la méthode 'signup' du contrôleur 'userCtrl'
router.post('/login', userCtrl.login); // Si requête POST envoyée à "/login", appeler la méthode 'login' du contrôleur 'userCtrl'

module.exports = router;
