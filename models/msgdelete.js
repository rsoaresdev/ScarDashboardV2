const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
  guildId: String,
  channelId: String,
});

module.exports = mongoose.model('msgdelete', Schema);
