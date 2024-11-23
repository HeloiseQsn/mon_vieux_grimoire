const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true }, 
  year: { 
    type: Number, 
    required: true,
    validate: {
      validator: function(value) {
        return /^\d{4}$/.test(value.toString());
      },
      message: "L'année doit être une année valide"
    }
  },
  genre: { type: String, required: true },
  userRating: { 
    type: Number, 
    required: true,
    min: [1, 'La note ne peut être inférieure à 1'],
    max: [5, 'La note ne peut être supérieure à  5']
  },
  imageUrl: { type: String, required: true },
  userId: { type: String, required: true },
});

module.exports = mongoose.model('Book', bookSchema);
