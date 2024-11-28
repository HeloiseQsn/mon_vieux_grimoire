const Book = require('../models/book');
const fs = require('fs'); //pour la suppression
const path = require('path');

exports.createBook = (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book); // Convertit les données JSON en objet JS

    delete bookObject._id; // Supprime l'ID client
    delete bookObject._userId; // Supprime l'ID utilisateur client

    if (!req.file) {
      // on vérifie la présence d'un fichier
      return res.status(400).json({ error: 'Aucun fichier image fourni.' });
    }

    const imagePath = path.join(__dirname, '..', 'images', req.file.filename); // Chemin de l'image téléchargée qui permet de la supprimer si l'ajout du livre n'aboutit pas

    const book = new Book({
      ...bookObject, // Copie des propriétés
      userId: req.auth.userId, // Ajoute l'ID utilisateur authentifié
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`, // Construction de l'URL de l'image
    });

    book
      .save()
      .then(() => {
        res.status(201).json({ message: 'Livre enregistré !' });
      })
      .catch((error) => {
        // Si une erreur survient lors de la sauvegarde, on supprime l'image téléchargée
        console.error('Erreur lors de la sauvegarde dans MongoDB:', error);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }

        if (error.name === 'ValidationError') {
          return res
            .status(422)
            .json({ error: 'Erreur de validation des données.' });
        }

        res.status(500).json({ error: 'Erreur du serveur.' });
      });
  } catch (error) {
    // Capture d'erreurs liées au parsing du JSON, ou à la logique du code
    console.error('Erreur dans le middleware:', error);

    // Suppression du fichier image si une erreur survient avant la sauvegarde
    if (req.file) {
      const imagePath = path.join(__dirname, '..', 'images', req.file.filename);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // Supprime le fichier
      }
    }

    res.status(400).json({ error: error.message || 'Erreur dans la requête.' });
  }
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        // Si un fichier est envoyé, on crée l'URL de la nouvelle image
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
      }
    : { ...req.body }; // Sinon on récupère l'ensemble du req.body

  delete bookObject._userId;

  Book.findOne({ _id: req.params.id }) // Recherche du livre par ID
    .then((book) => {
      if (book.userId != req.auth.userId) {
        // Vérification que l'utilisateur authentifié est bien le propriétaire du livre
        return res.status(401).json({ message: 'Non authorisé' });
      }

      // Suppression de l'ancienne image si un fichier est téléchargé et qu'il y a une image existante
      if (req.file && book.imageUrl) {
        const oldImage = book.imageUrl.split('/images/')[1]; // Extraction du nom de l'ancienne image
        const oldImagePath = path.join(__dirname, '..', 'images', oldImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath); // Suppression de l'ancienne image
        }
      }

      Book.updateOne(
        { _id: req.params.id },
        { ...bookObject, _id: req.params.id },
        { runValidators: true }
      ) // Mise à jour du livre
        .then(() => res.status(200).json({ message: 'Livre modifié !' }))
        .catch((error) => {
          // En cas d'erreur lors de la mise à jour, on supprime la nouvelle image si elle a été téléchargée
          if (req.file) {
            const newImagePath = path.join(
              __dirname,
              '..',
              'images',
              req.file.filename
            );
            if (fs.existsSync(newImagePath)) {
              fs.unlinkSync(newImagePath); // Suppression de la nouvelle image
            }
          }
          res.status(422).json({ error });
        });
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id }) // Recherche du livre par ID
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: 'Livre non trouvé.' });
      }
      if (book.userId != req.auth.userId) {
        // Vérification de l'ID du créateur du livre
        res.status(401).json({ message: 'Non autorisé' });
      } else {
        const filename = book.imageUrl.split('/images/')[1]; // Extraction du nom du fichier à partir de l'URL de l'image
        fs.unlink(`images/${filename}`, () => {
          // Suppression du fichier image
          Book.deleteOne({ _id: req.params.id }) // Suppression du livre de la base de données
            .then(() => {
              res.status(200).json({ message: 'Livre supprimé !' });
            })
            .catch((error) => res.status(500).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.findOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id }) // Recherche du livre par ID
    .then((book) => res.status(200).json(book)) // Réponse avec les détails du livre
    .catch((error) => res.status(404).json({ error }));
};

exports.findAllBooks = (req, res, next) => {
  Book.find() // Recherche de tous les livres
    .then((books) => res.status(200).json(books)) // Réponse avec la liste de tous les livres
    .catch((error) => res.status(500).json({ error }));
};

exports.updateRating = (req, res, next) => {
  const rating = req.body.rating; // On extrait la note dans le req.body du livre

  Book.findOne({ _id: req.params.id }) // Recherche du livre par ID
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: 'Livre non trouvé.' });
      }

      const existingRating = book.ratings.find(
        (rating) => rating.userId === req.auth.userId
      ); //On vérifie que l'ID de l'utilisateur qui a posté la note = ID de l'utilisateur authentifié

      if (existingRating) {
        existingRating.grade = rating; //S'il existe déjà une note pour cet utilisateur, on reprend cette note, sinon ajout de la nouvelle note
      } else {
        book.ratings.push({ userId: req.auth.userId, grade: rating });
      }

      const totalRatings = book.ratings.reduce(
        (acc, curr) => acc + curr.grade,
        0
      ); //total des notes ajouté à la valeur initiale de 0
      book.averageRating = (totalRatings / book.ratings.length).toFixed(2); // Mise à jour de la note moyenne

      book
        .save() // Sauvegarde du livre avec la nouvelle note
        .then(() => {
          res.status(200).json(book);
        })
        .catch((error) => {
          res.status(400).json({ error });
        });
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.findBestRatedBooks = (req, res, next) => {
  Book.find()
    .then((books) => {
      //on trie les livres par ordre décroissant des notes et on affiche les trois premiers
      const bestRatedBooks = books
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 3);
      res.status(200).json(bestRatedBooks);
    })
    .catch((error) => res.status(500).json({ error }));
};
