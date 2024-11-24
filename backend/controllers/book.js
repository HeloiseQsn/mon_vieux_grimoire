const Book = require('../models/Book');  // Importation du modèle Book depuis le dossier models
const fs = require('fs');  // Importation du module fs pour les opérations de fichiers

exports.createBook = (req, res, next) => {
  
  const bookObject = JSON.parse(req.body.book);  // Conversion de la chaîne JSON en objet JavaScript
  
  delete bookObject._id;  // Suppression de l'ID pour éviter les conflits avec la base de données
  delete bookObject._userId;  // Suppression de l'ID utilisateur pour le remplacer par celui authentifié
  
  const book = new Book({
      ...bookObject,  // Copie des propriétés de bookObject
      userId: req.auth.userId,  // Ajout de l'ID utilisateur authentifié
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`  // Construction de l'URL de l'image
  });

  book.save()
  .then(() => { res.status(201).json({message: 'Livre enregistré !'})})  // Envoi d'une réponse de succès
  .catch(error => { res.status(400).json( { error })});  // Envoi d'une réponse d'erreur en cas d'échec
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file ? {
      ...JSON.parse(req.body.book),  // Conversion et copie des propriétés si un fichier est présent
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`  // Mise à jour de l'URL de l'image
  } : { ...req.body };  // Sinon, copie des propriétés directement depuis req.body

  delete bookObject._userId;  // Suppression de l'ID utilisateur pour éviter les conflits

  Book.findOne({_id: req.params.id})  // Recherche du livre par ID
      .then((book) => {
          if (book.userId != req.auth.userId) {  // Vérification de l'authenticité de l'utilisateur
              res.status(401).json({ message : 'Not authorized'});  // Réponse d'erreur si non autorisé
          } else {
              Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})  // Mise à jour du livre
              .then(() => res.status(200).json({message : 'Livre modifié!'}))  // Réponse de succès
              .catch(error => res.status(401).json({ error }));  // Réponse d'erreur en cas d'échec
          }
      })
      .catch((error) => {
          res.status(400).json({ error });  // Réponse d'erreur en cas d'échec de la recherche
      });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id})  // Recherche du livre par ID
      .then(book => {
          if (book.userId != req.auth.userId) {  // Vérification de l'authenticité de l'utilisateur
              res.status(401).json({message: 'Not authorized'});  // Réponse d'erreur si non autorisé
          } else {
              const filename = book.imageUrl.split('/images/')[1];  // Extraction du nom de fichier de l'URL de l'image
              fs.unlink(`images/${filename}`, () => {  // Suppression du fichier image
                  Book.deleteOne({_id: req.params.id})  // Suppression du livre de la base de données
                      .then(() => { res.status(200).json({message: 'Livre supprimé !'})})  // Réponse de succès
                      .catch(error => res.status(401).json({ error }));  // Réponse d'erreur en cas d'échec
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });  // Réponse d'erreur en cas d'échec de la recherche
      });
};


exports.findOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })  // Recherche du livre par ID
    .then(book => res.status(200).json(book))  // Réponse avec les détails du livre
    .catch(error => res.status(404).json({ error }));  // Réponse d'erreur si le livre n'est pas trouvé
}

exports.findAllBooks = (req, res, next) => {
  Book.find()  // Recherche de tous les livres
    .then(books => res.status(200).json(books))  // Réponse avec la liste de tous les livres
    .catch(error => res.status(400).json({ error }));  // Réponse d'erreur en cas d'échec
}

exports.updateRating = (req, res, next) => {
  const rating = req.body.rating;  // Extraction de la note depuis le corps de la requête
  console.log("Received grade:", rating);
  console.log("Request params:", req.params);
  console.log("Authenticated user ID:", req.auth ? req.auth.userId : 'No user ID found');

  Book.findOne({ _id: req.params.id })  // Recherche du livre par ID
    .then(book => {
      if (!book) {
        console.log("Book not found");
        return res.status(404).json({ error: 'Book not found' });  // Réponse d'erreur si le livre n'est pas trouvé
      }

      console.log("Book found:", book);

      // Trouver l'évaluation existante de l'utilisateur, sinon ajouter une nouvelle évaluation
      const existingRating = book.ratings.find(r => r.userId === req.auth.userId);
      if (existingRating) {
        console.log("Existing rating found:", existingRating);
        existingRating.grade = rating;  // Mise à jour de la note existante
      } else {
        console.log("No existing rating found, adding new rating");
        book.ratings.push({ userId: req.auth.userId, grade : rating });  // Ajout d'une nouvelle note
      }

      console.log("Updated ratings:", book.ratings);

      // Calculer la nouvelle moyenne des évaluations
      const totalRatings = book.ratings.reduce((acc, curr) => acc + curr.grade, 0);
      book.averageRating = book.ratings.length ? totalRatings / book.ratings.length : 0;  // Mise à jour de la note moyenne

      console.log("New average rating:", book.averageRating);

      book.save()  // Sauvegarde du livre avec la nouvelle note
        .then(() => {
          console.log("Book saved successfully");
          res.status(200).json({ message: 'Grade updated!', id: book._id});  // Réponse de succès
        })
        .catch(error => {
          console.log("Error saving book:", error);
          res.status(400).json({ error });  // Réponse d'erreur en cas d'échec
        });
    })
    .catch(error => {
      console.log("Error finding book:", error);
      res.status(500).json({ error });  // Réponse d'erreur en cas d'échec de la recherche
    });
};


exports.findBestRatedBooks = (req, res, next) => {
  Book.find()
      .then(books => {
          // Trier les livres par note moyenne en ordre décroissant et limiter l'affichage à 3
          const bestRatedBooks = books.sort((a, b) => b.averageRating - a.averageRating).slice(0, 3);
          res.status(200).json(bestRatedBooks);
      })
      .catch(error => res.status(400).json({ error }));
};
