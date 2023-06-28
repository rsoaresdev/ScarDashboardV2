const mongoose = require('mongoose');

const languageSchema = mongoose.Schema({
  _id: String,
  language: {
    type: String,
    default: 'english',
  },
});

module.exports = mongoose.model('language', languageSchema);
