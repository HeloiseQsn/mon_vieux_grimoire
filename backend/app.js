const express = require('express');
const app = express();

app.use(express.json());

app.use((req, res, next) => {
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
   next();
 });

 app.post('/api/stuff', (req, res, next) => {
   console.log(req.body);
   res.status(201).json({
     message: 'Objet créé !'
   });
 });


app.get('/api/books', (req, res, next) => {
   const books = [
     {
       _id: 'oeihfzeoi',
       title: 'Milwaukee Mission',
       author: 'Elder Cooper',
       year: '2021',
       genre:'Policier',
       userRating:3,
       imageurl:'',
       userId: 'qsomihvqios',
     },
     {
      _id: 'oeihfzeoisg',
      title: 'Thinking fast & slow',
      author: 'Daniel Kahneman',
      year: '2022',
      genre:'Economie',
      userRating:3,
      imageurl:'',
      userId: 'qsofzhvqios',
     },
   ];
   res.status(200).json(books);
 });

module.exports = app;
