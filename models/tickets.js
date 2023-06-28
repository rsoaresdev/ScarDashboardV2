const mongoose = require('mongoose');

const ticketSchema = mongoose.Schema({
  category: String,
  serverId: String,
});

module.exports = mongoose.model('ticket', ticketSchema);
