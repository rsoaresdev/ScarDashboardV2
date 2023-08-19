process.on('unhandledRejection', (reason) => {
  if (!reason) return;
  console.error(reason);
});

process.on('uncaughtException', (err, origin) => {
  if (!err || !origin) return;
  console.error(err);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
  if (!err || !origin) return;
  console.error(err);
});

require('dotenv').config();

const Discord = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');

const cookieParser = require('cookie-parser');
const compression = require('compression');
const helmet = require('helmet');
const ratelimit = require('./functions/rateLimit');
const config = require('./config.json');

const app = express();
const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.GuildMessageReactions,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.MessageContent,
    Discord.GatewayIntentBits.GuildEmojisAndStickers,
  ],
});

mongoose.connect(process.env.MONGODB).then(() => console.log('> [DATABASE] Successfully connected to MongoDB'));

client.login(process.env.TOKEN);
client.once('ready', async () => {
  console.log('> Client connected!');

  app.use(compression({ threshold: 0 }));
  app.set('trust proxy', 1);
  app.use(ratelimit);
  app.use(cookieParser());
  [, app.locals.domain] = process.env.DOMAIN.split('//');
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  require('./dashboard/index')(app, client, config, express);

  app.listen(8080, async () => {
    console.log('> [WEB] Starting in web');
  });
});
