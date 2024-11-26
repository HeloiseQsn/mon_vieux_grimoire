const Book = require('../models/Book');  
const fs = require('fs');  //pour la suppression 

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);  //convertit données JSON transmises par le front en objet JS
  
  delete bookObject._id;  //suppression ID créé par le client car nouvel ID créé par Mongo automatiquement à l'enregistrement
  delete bookObject._userId;  //IDEM car on récupère l'ID de l'utilisateur authentifié
  
  const book = new Book({
      ...bookObject,  // Copie des propriétés de bookObject
      userId: req.auth.userId,  // Ajout de l'ID utilisateur authentifié
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`  // Construction de l'URL de l'image
  });

  book.save()
  .then(() => { res.status(201).json({message: 'Livre enregistré !'})}) 
  .catch(error => { res.status(400).json( { error })}); 
};


exports.modifyBook = (req, res, next) => {
  const bookObject = req.file ? { //si fichier envoyé, on convertit les données JSON en objet JS + on crée l'URL de la nouvelle image
      ...JSON.parse(req.body.book), 
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body }; //sinon on récupère l'ensemble du req.body

  delete bookObject._userId; 

  Book.findOne({_id: req.params.id})  // Recherche du livre par ID
      .then((book) => {
          if (book.userId != req.auth.userId) {  //on vérifie que lJD du créateur du livre = ID de l'utilisateur authentifié
              res.status(401).json({ message : 'Not authorized'});  
          } else {
              Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})  // Mise à jour du livre
              .then(() => res.status(200).json({message : 'Livre modifié!'}))
              .catch(error => res.status(401).json({ error })); 
          }
      })
      .catch((error) => {
          res.status(400).json({ error });  
      });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id})  // Recherche du livre par ID
      .then(book => {
          if (book.userId != req.auth.userId) {  // Vérification de l'ID du créateur du livre
              res.status(401).json({ message: 'Not authorized' });  
          } else {
              const filename = book.imageUrl.split('/images/')[1];  // Extraction du nom du fichier à partir de l'URL de l'image
              fs.unlink(`images/${filename}`, () => {  // Suppression du fichier image
                  Book.deleteOne({ _id: req.params.id })  // Suppression du livre de la base de données
                      .then(() => { res.status(200).json({ message: 'Livre supprimé !' }) })  
                      .catch(error => res.status(401).json({ error })); 
              });
          }
      })
      .catch(error => {
          res.status(500).json({ error });
      });
};

exports.findOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })  // Recherche du livre par ID
    .then(book => res.status(200).json(book))  // Réponse avec les détails du livre
    .catch(error => res.status(404).json({ error }));  
}

exports.findAllBooks = (req, res, next) => {
  Book.find()  // Recherche de tous les livres
    .then(books => res.status(200).json(books))  // Réponse avec la liste de tous les livres
    .catch(error => res.status(400).json({ error })); 
}

exports.updateRating = (req, res, next) => {
  const rating = req.body.rating;  // On extrait la note dans le req.body du livre

  Book.findOne({ _id: req.params.id })  // Recherche du livre par ID
    .then(book => {

      const existingRating = book.ratings.find(rating => rating.userId === req.auth.userId); //On vérifie que l'ID de l'utilisateur qui a posté la note = ID de l'utilisateur authentifié

      if (existingRating) {
        existingRating.grade = rating; //S'il existe déjà une note pour cet utilisateur, on reprend cette note, sinon ajout de la nouvelle note
      } else {
        book.ratings.push({ userId: req.auth.userId, grade : rating });  
      }

      const totalRatings = book.ratings.reduce((acc, curr) => acc + curr.grade, 0); //total des notes ajouté à la valeur initiale de 0
      book.averageRating = totalRatings / book.ratings.length;  // Mise à jour de la note moyenne

      book.save()  // Sauvegarde du livre avec la nouvelle note
        .then(() => {
          res.status(200).json(book); 
        })
        .catch(error => {
          res.status(400).json({ error });
        });
    })
    .catch(error => {
      res.status(500).json({ error });  
    });
};


exports.findBestRatedBooks = (req, res, next) => {
  Book.find()
      .then(books => {
          //on trie les livres par ordre décroissant des notes et on affiche les trois premiers 
          const bestRatedBooks = books.sort((a, b) => b.averageRating - a.averageRating).slice(0, 3);
          res.status(200).json(bestRatedBooks);
      })
      .catch(error => res.status(400).json({ error }));
};
