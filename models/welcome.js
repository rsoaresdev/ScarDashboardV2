const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
  guildId: String,
  welcomeMsg: String,
  channelId: String,
});

module.exports = mongoose.model('welcome', Schema);
