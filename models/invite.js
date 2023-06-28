const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
  guildId: String,
});

module.exports = mongoose.model('invite', Schema);
