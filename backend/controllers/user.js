const bcrypt = require('bcrypt'); //hachage des mots de passe
const jwt = require ('jsonwebtoken'); //génération de token
const User = require('../models/User');


exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10) // Prend le mot de passe fourni par l'utilisateur (req.body.password) et le hache avec un facteur de coût de 10
      .then(hash => {
        const user = new User({
          email: req.body.email, //récupération du mail dans la requête body 
          password: hash // récupération du mot de passe hashé
        });
        user.save() //enregistrement
          .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
          .catch(error => res.status(400).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
  };

  exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email }) //recherche mail de l'user dans la BDD
        .then(user => {
            if (!user) {
                return res.status(401).json({ error }); 
            }
            bcrypt.compare(req.body.password, user.password) //si utilisateur trouvé, comparaison du mot de passe avec mdp hashé
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ error });
                    }
                    res.status(200).json({ //on renvoie l'user ID et un token jwt au front
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            'RANDOM_TOKEN_SECRET', 
                            { expiresIn: '24h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
 };