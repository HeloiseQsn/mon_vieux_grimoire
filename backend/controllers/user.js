const bcrypt = require('bcrypt'); //hachage des mots de passe
const jwt = require('jsonwebtoken'); //génération de token
const User = require('../models/user');
const validator = require('validator');

exports.signup = (req, res, next) => {
  const { email, password } = req.body;

  // Vérification de l'email
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  User.findOne({ email: email })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(409).json({ error: 'Email déjà utilisé' });
      }
      const passwordStrength =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/; // Minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
      if (!passwordStrength.test(password)) {
        return res.status(400).json({
          error:
            'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre',
        });
      }

      // Hachage du mot de passe
      bcrypt
        .hash(password, 10)
        .then((hash) => {
          const user = new User({
            email: email,
            password: hash,
          });

          // Enregistrement de l'utilisateur
          user
            .save()
            .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
            .catch((error) => res.status(400).json({ error }));
        })
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email }) //recherche mail de l'user dans la BDD
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error });
      }
      bcrypt
        .compare(req.body.password, user.password) //si utilisateur trouvé, comparaison du mot de passe avec mdp hashé
        .then((valid) => {
          if (!valid) {
            return res.status(401).json({ error });
          }
          res.status(200).json({
            //on renvoie l'user ID et un token jwt au front
            userId: user._id,
            token: jwt.sign({ userId: user._id }, 'RANDOM_TOKEN_SECRET', {
              expiresIn: '24h',
            }),
          });
        })
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
