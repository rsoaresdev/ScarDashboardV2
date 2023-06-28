const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
  guildId: String,
  message: String,
});

module.exports = mongoose.model('msgTicket', Schema);
