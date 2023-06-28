const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
  guildId: String,
  goodbyeMsg: String,
  channelId: String,
});

module.exports = mongoose.model('goodbye', Schema);
