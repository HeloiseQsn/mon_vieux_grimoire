const express = require('express');
const mongoose = require('mongoose'); 
const bodyParser = require('body-parser');
const path = require('path'); 

const booksRoutes = require('./routes/book');  // Routes pour livres
const userRoutes = require('./routes/user');  // Routes pour utilisateur

// Connexion à la base de données MongoDB avec Mongoose
mongoose.connect('mongodb+srv://MVGadministrator:6iZsT0RBJGyZwbbz@cluster0.hpsn9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0') 
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(() => console.log('Connexion à MongoDB échouée !'));  


const app = express();

// Middleware pour gérer les en-têtes CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');  // Autorise toutes les origines à accéder aux ressources
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');  // Définit les en-têtes autorisés
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');  // Définit les méthodes HTTP autorisées
  next(); 
});

// Middleware pour analyser le corps des requêtes au format JSON
app.use(bodyParser.json());  // Permet de traiter les données JSON dans les requêtes entrantes
app.use(bodyParser.urlencoded({ extended: true }));  // Permet de traiter les données de formulaire URL-encodées

// Middleware pour servir les fichiers statiques dans le répertoire 'images'
app.use('/images', express.static(path.join(__dirname, 'images')));


app.use('/api/books', booksRoutes); 
app.use('/api/auth', userRoutes); 

// si aucune route n'est correspondante, retourne une erreur 404
app.use((req, res, next) => {
  res.status(404).json({ error }); 
});


module.exports = app;
