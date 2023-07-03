/* eslint-disable max-len */
module.exports = (app, client, config, express) => {
  const Discord = require('discord.js');
  const path = require('path');
  const csrf = require('csurf');
  const ejs = require('ejs');
  const moment = require('moment');
  const rateLimit = require('express-rate-limit');
  const csrfProtection = csrf({
    cookie: true,
  });
  const session = require('express-session');
  const MemoryStore = require('memorystore')(session);
  const passport = require('passport');
  const {
    Strategy,
  } = require('passport-discord');
  const SchemaWelcome = require(`../models/welcome`);
  const SchemaLeave = require(`../models/goodbye`);
  const SchemaEdited = require(`../models/msgedit`);
  const SchemaDeleted = require(`../models/msgdelete`);
  const SchemaLanguage = require(`../models/language`);
  const SchemaTicket = require(`../models/tickets`);
  const SchemaTicketOpen = require(`../models/ticketsopen`);
  const SchemaAntiInvite = require(`../models/invite`);
  const SchemaAutoRole = require(`../models/autorole`);
  const SchemaLevelUp = require(`../models/levelup`);
  const SchemaTicketMsg = require(`../models/msgTicket`);
  app.use(express.static(`./dashboard/static`));
  const expireDate = 1000 * 60 * 60 * 24; // 1 day
  const sessionStore = new MemoryStore({
    checkPeriod: expireDate,
  });

  app.use(
    session({
      cookie: {
        expires: expireDate,
        secure: true,
        maxAge: expireDate,
      },
      secret: process.env.SECRET,
      store: sessionStore,
      resave: false,
      saveUninitialized: true,
    }),
  );
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));
  passport.use(
    new Strategy(
      {
        clientID: process.env.ID,
        clientSecret: process.env.SECRET,
        callbackURL: `${process.env.DOMAIN}/callback`,
        response_type: 'code',
        scope: ['identify', 'guilds'],
      },
      (accessToken, refreshToken, profile, done) => {
        process.nextTick(() => done(null, profile));
      },
    ),
  );
  app.use(passport.initialize());
  app.use(passport.session());
  const checkAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    req.session.backURL = req.url;
    return res.redirect('/login');
  };
  const templateDir = path.resolve('./dashboard/templates');
  app.engine('html', ejs.renderFile);
  app.set('view engine', 'html');
  const renderTemplate = (res, req, template, data = {}) => {
    const hostname = req.headers.host;
    const parsedUrl = new URL(req.url, process.env.DOMAIN);
    const { pathname } = parsedUrl;
    const baseData = {
      bot: client,
      config,
      hostname,
      pathname,
      path: req.path,
      user: req.isAuthenticated() ? req.user : null,
      description: `${config.description}`,
      domain: app.locals.domain,
      alert: '',
      url: res,
      title: 'Scar — The only one bot you will ever need!',
      req,
      port: 8080,
      name: 'Scar',
      tag: client.tag,
    };
    return res.render(
      path.resolve(`${templateDir}/${template}`),
      Object.assign(baseData, data),
    );
  };
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    handler(req, res) {
      renderTemplate(res, req, 'rate_limit.ejs', {
        perms: Discord.PermissionsBitField,
      });
    },
  });
  app.use(limiter);

  function errorPage(req, res, alert) {
    if (alert) {
      renderTemplate(res, req, 'error.ejs', {
        perms: Discord.PermissionsBitField,
        alert,
      });
    } else {
      renderTemplate(res, req, 'error.ejs', {
        perms: Discord.PermissionsBitField,
      });
    }
  }

  // Login endpoint.
  app.get(
    '/login',
    (req, res, next) => {
      if (req.headers.referer) {
        const parsed = new URL(req.headers.referer);
        if (parsed.hostname === app.locals.domain) {
          req.session.backURL = parsed.path;
        }
      } else {
        req.session.backURL = '/';
      }
      next();
    },
    passport.authenticate('discord'),
  );
  // Callback endpoint.
  app.get(
    '/callback',
    passport.authenticate('discord', {
      failureRedirect: '/',
    }),
    (req, res) => {
      if (req.session.backURL) {
        const url = req.session.backURL;
        req.session.backURL = null;
        res.redirect(url);
      } else {
        res.redirect('/');
      }
    },
  );
  // Features list redirect endpoint.
  app.get('/profile', checkAuth, async (req, res) => {
    const user = req.user.id;
    const fetchedUser = await client.users.fetch(user);
    await renderTemplate(res, req, 'profile.ejs', {
      perms: Discord.PermissionsBitField,
      moment,
      fetched: fetchedUser,
    });
  });
  // Server redirect endpoint.
  app.get('/server', (req, res) => {
    res.redirect(config.supportServer);
  });
  // Server redirect endpoint.
  app.get('/introdashboard', (req, res) => {
    res.redirect('https://www.youtube.com/watch?v=spFnp4bl-hM&t=2s');
  });
  app.get('/form2023', (req, res) => {
    res.redirect('https://forms.gle/YQ3Dbigrh1GNaqpB9');
  });
  app.get('/invite', (req, res) => {
    res.redirect(
      `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=${config.permissions}&redirect_uri=https://scarbot.com/callback&response_type=code&scope=guilds%20identify%20bot`,
    );
  });
  app.get('/form2023', (req, res) => {
    res.redirect('https://forms.gle/YQ3Dbigrh1GNaqpB9');
  });
  // Status page endpoint.
  app.get('/status', (req, res) => {
    res.redirect('https://status.scarbot.com');
  });
  // Commands list endoint.
  app.get('/commands', (req, res) => {
    renderTemplate(res, req, 'commands.ejs');
  });
  // Server redirect endpoint.
  app.get('/donate', (req, res) => {
    renderTemplate(res, req, 'donate.ejs');
  });
  // Logout endpoint.
  app.get('/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/');
    });
  });
  // Index endpoint.
  app.get('/', (req, res) => {
    renderTemplate(res, req, 'index.ejs');
  });
  // Index endpoint.
  app.get('/terms', (req, res) => {
    res.redirect(
      `https://docs.scarbot.com/legal/tos`,
    );
  });
  // Index endpoint.
  app.get('/privacy', (req, res) => {
    res.redirect(
      `https://docs.scarbot.com/legal/privacy`,
    );
  });
  // Dashboard endpoint.
  app.get('/dashboard', checkAuth, (req, res) => {
    renderTemplate(res, req, 'dashboard.ejs', {
      perms: Discord.PermissionsBitField,
    });
  });
  // Dashboard error handler
  app.get('/error', (req, res) => errorPage(req, res));
  // Support endpoint
  app.get('/support', csrfProtection, async (req, res) => {
    renderTemplate(res, req, 'support.ejs', {
      csrfToken: req.csrfToken(),
    });
  });
  app.post('/support', csrfProtection, checkAuth, async (req, res) => {
    const data = req.body;
    if (!data) {
      res.status(400);
      return errorPage(req, res, 'No data was sent!');
    }
    if (!data.id) {
      res.status(401);
      return errorPage(
        req,
        res,
        'You must be logged in to perform this action!',
      );
    }
    if (!data.name) {
      return renderTemplate(res, req, 'support.ejs', {
        alert: data.name && data.name.length < 1
          ? 'Invalid nickname!'
          : 'Please enter your nickname!',
        error: true,
        csrfToken: req.csrfToken(),
      });
    }
    if (data.name && data.name.length > 100) {
      return renderTemplate(res, req, 'support.ejs', {
        alert: 'Too long username! (Max: 100)',
        error: true,
        csrfToken: req.csrfToken(),
      });
    }
    if (data.email.length > 100) {
      return renderTemplate(res, req, 'support.ejs', {
        alert: 'Too long email (Max: 100)!',
        error: true,
        csrfToken: req.csrfToken(),
      });
    }
    if (!data.message || data.message.length < 1) {
      return renderTemplate(res, req, 'support.ejs', {
        alert: 'Please enter your message!',
        error: true,
        csrfToken: req.csrfToken(),
      });
    }
    if (data.message && data.message.length > 1000) {
      return renderTemplate(res, req, 'support.ejs', {
        alert: 'Too long message! (Max: 1000)',
        error: true,
        csrfToken: req.csrfToken(),
      });
    }
    if (!data.reason) {
      return renderTemplate(res, req, 'support.ejs', {
        alert: !data.reason
          ? 'Invalid reason selected!'
          : 'Please select valid reason!',
        error: true,
        csrfToken: req.csrfToken(),
      });
    }
    const webhook = new Discord.WebhookClient({
      url: process.env.CONTACT_WEBHOOK,
    });
    const supportForm = new Discord.EmbedBuilder()
      .setColor('#4f545c')
      .setTitle('📬 Support Form')
      .setDescription('**Someone just send message to us!**')
      .addFields(
        {
          name: 'User',
          value: `>>> Username: \`${data.name.substr(0, 100)}\`\n Mention: <@${
            data.id
          }>\nID: \`${data.id}\``,
        },
        {
          name: 'Email',
          value: `> ||[${
            data.email.substr(0, 100) || 'No email'
          }](https://discord.com/users/${data.id})||`,
        },
        {
          name: 'Message',
          value: `\`\`\`\n${Discord.escapeCodeBlock(
            data.message.substr(0, 1000),
          ).replace(/`/g, "'")}\n\`\`\``,
        },
        { name: 'Reason', value: ` > \`${data.reason.replaceAll('_', ' ')}\`` },
      )
      .setTimestamp()
      .setFooter({
        text: client.user.username,
        iconURL: client.user.displayAvatarURL(),
      });
    webhook.send({
      embeds: [supportForm],
    });
    return renderTemplate(res, req, 'support.ejs', {
      alert: 'Your message have been send!',
      error: false,
      csrfToken: req.csrfToken(),
    });
  });
  // Settings endpoint.
  app.get(
    '/dashboard/:guildID',
    csrfProtection,
    checkAuth,
    async (req, res) => {
      try {
        const guild = await client.guilds.cache.get(req.params.guildID);
        if (!guild) {
          return errorPage(
            req,
            res,
            'No such server, add a bot to perform this action!',
          );
        }
        const firstMember = req.user.id;
        await guild.members.fetch({
          firstMember,
        });
        const member = guild.members.cache.get(req.user.id);
        const owner = await guild.fetchOwner();
        if (!member) {
          return errorPage(
            req,
            res,
            'You must be on this server to perform this action!',
          );
        }
        if (!member.permissions.has('ManageGuild')) {
          return errorPage(
            req,
            res,
            'You do not have the ManageGuild permissions!',
          );
        }
        const languageData = await SchemaLanguage.findOne({ _id: guild.id });
        return renderTemplate(res, req, '/server/server.ejs', {
          guild,
          perms: Discord.PermissionsBitField,
          language: languageData,
          guild_owner: owner,
          csrfToken: req.csrfToken(),
        });
      } catch (e) {
        console.log(e);
        return errorPage(req, res, e);
      }
    },
  );
  // Settings save endpoint
  app.post(
    '/dashboard/:guildID',
    csrfProtection,
    checkAuth,
    async (req, res) => {
      try {
        const guild = await client.guilds.cache.get(req.params.guildID);
        if (!guild) {
          return errorPage(
            req,
            res,
            'No such server, add a bot to perform this action!',
          );
        }
        const firstMember = req.user.id;
        await guild.members.fetch({
          firstMember,
        });
        const member = guild.members.cache.get(req.user.id);
        if (!member) {
          return errorPage(
            req,
            res,
            'You must be on this server to perform this action!',
          );
        }
        if (!member.permissions.has('ManageGuild')) {
          return errorPage(
            req,
            res,
            'You do not have the ManageGuild permissions!',
          );
        }
        const data = req.body;
        if (!data) {
          res.status(403);
          return errorPage(req, res, 'No data send!');
        }
        let {
          nickname,
        } = data;
        if (nickname && nickname.length < 1) {
          nickname = guild.members.me.nickname || guild.members.me.user.username;
        }
        if (data.nickname) {
          if (!nickname) {
            nickname = guild.members.me.nickname || guild.members.me.user.username;
          }
          await guild.members.me.setNickname(nickname);
        }
        const lang = data.selectLanguage;
        const dataSchema = await SchemaLanguage.findOne({ _id: guild.id });

        if (dataSchema) {
          dataSchema.language = lang;
          await dataSchema.save();
        } else {
          new SchemaLanguage({
            _id: guild.id,
            language: lang,
          }).save();
        }

        const languageData = await SchemaLanguage.findOne({ _id: guild.id });
        const owner = await guild.fetchOwner();
        return renderTemplate(res, req, '/server/server.ejs', {
          guild,
          perms: Discord.PermissionsBitField,
          language: languageData,
          guild_owner: owner,
          csrfToken: req.csrfToken(),
        });
      } catch (error) {
        return console.error(error);
      }
    },
  );
  app.get('/dashboard/:guildID/roles', checkAuth, async (req, res) => {
    const guild = await client.guilds.cache.get(req.params.guildID);
    if (!guild) {
      return errorPage(
        req,
        res,
        'No such server, add a bot to perform this action!',
      );
    }
    const firstMember = req.user.id;
    await guild.members.fetch({
      firstMember,
    });
    const member = guild.members.cache.get(req.user.id);
    if (!member) {
      return errorPage(
        req,
        res,
        'You must be on this server to perform this action!',
      );
    }
    if (!member.permissions.has('ManageGuild')) {
      return errorPage(
        req,
        res,
        'You do not have the ManageGuild permissions!',
      );
    }
    return renderTemplate(res, req, '/server/roles.ejs', {
      guild,
      perms: Discord.PermissionsBitField,
      guild_owner: await guild.fetchOwner(),
    });
  });
  app.get('/dashboard/:guildID/roles/:roleID', checkAuth, async (req, res) => {
    const guild = await client.guilds.cache.get(req.params.guildID);
    if (!guild) {
      return errorPage(
        req,
        res,
        'No such server, add a bot to perform this action!',
      );
    }
    if (!req.params.roleID) {
      return errorPage(
        req,
        res,
        'There is no such role! You cannot display information about it',
      );
    }
    const firstMember = req.user.id;
    await guild.members.fetch({
      firstMember,
    });
    const member = guild.members.cache.get(req.user.id);
    if (!member) {
      return errorPage(
        req,
        res,
        'You must be on this server to perform this action!',
      );
    }
    if (!member.permissions.has('ManageGuild')) {
      return errorPage(
        req,
        res,
        'You do not have the ManageGuild permissions!',
      );
    }
    const role = guild.roles.cache.find(
      (roleX) => roleX.id === req.params.roleID,
    );
    if (!role) {
      return errorPage(
        req,
        res,
        'There is no such role! You cannot display information about it',
      );
    }
    return renderTemplate(res, req, '/server/role-info.ejs', {
      guild,
      perms: Discord.PermissionsBitField,
      role,
      guild_owner: await guild.fetchOwner(),
    });
  });
  app.get(
    '/dashboard/:guildID/logging',
    csrfProtection,
    checkAuth,
    async (req, res) => {
      const guild = await client.guilds.cache.get(req.params.guildID);
      if (!guild) {
        return errorPage(
          req,
          res,
          'No such server, add a bot to perform this action!',
        );
      }
      const firstMember = req.user.id;
      await guild.members.fetch({
        firstMember,
      });
      const owner = await guild.fetchOwner();
      const member = guild.members.cache.get(req.user.id);
      if (!member) {
        return errorPage(
          req,
          res,
          'You must be on this server to perform this action!',
        );
      }
      if (!member.permissions.has('ManageGuild')) {
        return errorPage(
          req,
          res,
          'You do not have the ManageGuild permissions!',
        );
      }
      // welcome
      const welcomeData = await SchemaWelcome.findOne({ guildId: guild.id });
      // leave
      const leaveData = await SchemaLeave.findOne({ guildId: guild.id });
      // edited
      const editedData = await SchemaEdited.findOne({ guildId: guild.id });
      // deleted
      const deletedData = await SchemaDeleted.findOne({ guildId: guild.id });
      // levelup
      const levelUpData = await SchemaLevelUp.findOne({ guildId: guild.id });
      return renderTemplate(res, req, '/server/logging.ejs', {
        guild,
        ChannelType: Discord.ChannelType,
        perms: Discord.PermissionsBitField,
        welcome: welcomeData,
        leave: leaveData,
        edited: editedData,
        deleted: deletedData,
        levelup: levelUpData,
        csrfToken: req.csrfToken(),
        guild_owner: owner,
      });
    },
  );
  app.post(
    '/dashboard/:guildID/logging',
    csrfProtection,
    checkAuth,
    async (req, res) => {
      const guild = await client.guilds.cache.get(req.params.guildID);
      if (!guild) {
        return errorPage(
          req,
          res,
          'No such server, add a bot to perform this action!',
        );
      }
      const firstMember = req.user.id;
      await guild.members.fetch({
        firstMember,
      });
      const member = guild.members.cache.get(req.user.id);
      if (!member) {
        return errorPage(
          req,
          res,
          'You must be on this server to perform this action!',
        );
      }
      if (!member.permissions.has('ManageGuild')) {
        return errorPage(
          req,
          res,
          'You do not have the ManageGuild permissions!',
        );
      }
      const data = req.body;
      if (data) {
        const welcomeChannel = data.welcomechannel;
        const leaveChannel = data.leavechannel;
        let msgWelcomeString = data.msgWelcome;
        let msgLeaveString = data.msgLeave;
        const editedChannel = data.editedchannel;
        const deletedChannel = data.deletedchannel;
        const levelupChannel = data.levelupchannel;
        if (msgWelcomeString === '' || msgWelcomeString === ' ') {
          msgWelcomeString = 'The welcome message was not set correctly.';
        }
        if (msgLeaveString === '' || msgLeaveString === ' ') {
          msgLeaveString = 'The leave message was not set correctly.';
        }
        if (data.welcome_enabled && SchemaWelcome) {
          const dataWel = await SchemaWelcome.findOne({ guildId: guild.id });
          if (dataWel) {
            dataWel.channelId = welcomeChannel;
            dataWel.welcomeMsg = msgWelcomeString;
            await dataWel.save();
          } else {
            new SchemaWelcome({
              guildId: guild.id,
              channelId: welcomeChannel,
              welcomeMsg: msgWelcomeString,
            }).save();
          }
        } else {
          const dataWel = await SchemaWelcome.findOne({ guildId: guild.id });
          if (dataWel) await dataWel.deleteOne();
        }

        if (data.leave_enabled && SchemaLeave) {
          const dataLeave = await SchemaLeave.findOne({ guildId: guild.id });
          if (dataLeave) {
            dataLeave.channelId = leaveChannel;
            dataLeave.goodbyeMsg = msgLeaveString;
            await dataLeave.save();
          } else {
            new SchemaLeave({
              guildId: guild.id,
              channelId: leaveChannel,
              goodbyeMsg: msgLeaveString,
            }).save();
          }
        } else {
          const dataLeave = await SchemaLeave.findOne({ guildId: guild.id });
          if (dataLeave) await dataLeave.deleteOne();
        }
        if (data.edited_enabled && SchemaEdited) {
          const dataEdit = await SchemaEdited.findOne({ guildId: guild.id });

          if (dataEdit) {
            dataEdit.channelId = editedChannel;
            await dataEdit.save();
          } else {
            new SchemaEdited({
              guildId: guild.id,
              channelId: editedChannel,
            }).save();
          }
        } else {
          const dataEdit = await SchemaEdited.findOne({ guildId: guild.id });
          if (dataEdit) await dataEdit.deleteOne();
        }
        if (data.deleted_enabled && SchemaDeleted) {
          const dataDeleted = await SchemaDeleted.findOne({ guildId: guild.id });

          if (dataDeleted) {
            dataDeleted.channelId = deletedChannel;
            await dataDeleted.save();
          } else {
            new SchemaDeleted({
              guildId: guild.id,
              channelId: deletedChannel,
            }).save();
          }
        } else {
          const dataDeleted = await SchemaDeleted.findOne({ guildId: guild.id });
          if (dataDeleted) await dataDeleted.deleteOne();
        }
        if (data.levelup_enabled && SchemaLevelUp) {
          const dataLevel = await SchemaLevelUp.findOne({ guildId: guild.id });
          if (dataLevel) {
            dataLevel.channelId = levelupChannel;
            await dataLevel.save();
          } else {
            new SchemaLevelUp({
              guildId: guild.id,
              channelId: levelupChannel,
            }).save();
          }
        } else {
          const dataLevel = await SchemaLevelUp.findOne({ guildId: guild.id });
          if (dataLevel) await dataLevel.deleteOne();
        }
        return res.redirect(`/dashboard/${guild.id}/logging`);
      }
      return true;
    },
  );
  app.get(
    '/dashboard/:guildID/tickets',
    csrfProtection,
    checkAuth,
    async (req, res) => {
      const guild = await client.guilds.cache.get(req.params.guildID);
      if (!guild) {
        return errorPage(
          req,
          res,
          'No such server, add a bot to perform this action!',
        );
      }
      const firstMember = req.user.id;
      await guild.members.fetch({
        firstMember,
      });
      const owner = await guild.fetchOwner();
      const member = guild.members.cache.get(req.user.id);
      if (!member) {
        return errorPage(
          req,
          res,
          'You must be on this server to perform this action!',
        );
      }
      if (!member.permissions.has('ManageGuild')) {
        return errorPage(
          req,
          res,
          'You do not have the ManageGuild permissions!',
        );
      }
      const ticketData = await SchemaTicket.findOne({ serverId: guild.id });
      const ticketDataOpen = await SchemaTicketOpen.findOne({ serverId: guild.id });
      const ticketDataMsg = await SchemaTicketMsg.findOne({ guildId: guild.id });

      return renderTemplate(res, req, '/server/tickets.ejs', {
        guild,
        ChannelType: Discord.ChannelType,
        perms: Discord.PermissionsBitField,
        category: ticketData,
        categoryopen: ticketDataOpen,
        openticketmessage: ticketDataMsg,
        csrfToken: req.csrfToken(),
        guild_owner: owner,
      });
    },
  );
  app.post(
    '/dashboard/:guildID/tickets',
    csrfProtection,
    checkAuth,
    async (req, res) => {
      const guild = await client.guilds.cache.get(req.params.guildID);
      if (!guild) {
        return errorPage(
          req,
          res,
          'No such server, add a bot to perform this action!',
        );
      }
      const firstMember = req.user.id;
      await guild.members.fetch({
        firstMember,
      });
      const member = guild.members.cache.get(req.user.id);
      if (!member) {
        return errorPage(
          req,
          res,
          'You must be on this server to perform this action!',
        );
      }
      if (!member.permissions.has('ManageGuild')) {
        return errorPage(
          req,
          res,
          'You do not have the ManageGuild permissions!',
        );
      }
      const data = req.body;
      const dataTicket = data.categorychannel;
      const dataTicketOpen = data.categoryopenchannel;
      let msgTicketString = data.openticketmessage_msg;

      if (msgTicketString === '' || msgTicketString === ' ') {
        msgTicketString = 'The Staff Team will help you soon! To close the ticket, press the button below.';
      }

      if (data) {
        if (data.category_enabled) {
          const dataTicketSchema = await SchemaTicket.findOne({ serverId: guild.id });

          if (dataTicketSchema) {
            dataTicketSchema.category = dataTicket;
            await dataTicketSchema.save();
          } else {
            new SchemaTicket({
              serverId: guild.id,
              category: dataTicket,
            }).save();
          }
        } else {
          const dataTicketSchema = await SchemaTicket.findOne({ serverId: guild.id });
          if (dataTicketSchema) await dataTicketSchema.deleteOne();
        }
        if (data.categoryopen_enabled) {
          const dataTicketOpenSchema = SchemaTicketOpen.findOne({ serverId: guild.id });
          if (dataTicketOpenSchema) {
            dataTicketOpenSchema.category = dataTicketOpen;
            await dataTicketOpenSchema.save();
          } else {
            new SchemaTicketOpen({
              serverId: guild.id,
              category: dataTicketOpen,
            }).save();
          }
        } else {
          const dataTicketOpenSchema = SchemaTicketOpen.findOne({ serverId: guild.id });
          if (dataTicketOpenSchema) dataTicketOpenSchema.deleteOne();
        }

        console.log(data.openticketmessage_enabled);
        if (data.openticketmessage_enabled) {
          const dataTicketMSGSchema = await SchemaTicketMsg.findOne({ guildId: guild.id });
          if (dataTicketMSGSchema) {
            dataTicketMSGSchema.message = msgTicketString;
            await dataTicketMSGSchema.save();
          } else {
            new SchemaTicketMsg({
              guildId: guild.id,
              message: msgTicketString,
            }).save();
          }
        } else {
          const dataTicketMSGSchema = await SchemaTicketMsg.findOne({ guildId: guild.id });
          if (dataTicketMSGSchema) await dataTicketMSGSchema.deleteOne();
        }

        return res.redirect(`/dashboard/${guild.id}/tickets`);
      }
      return true;
    },
  );
  app.get(
    '/dashboard/:guildID/automod',
    csrfProtection,
    checkAuth,
    async (req, res) => {
      const guild = await client.guilds.cache.get(req.params.guildID);
      if (!guild) {
        return errorPage(
          req,
          res,
          'No such server, add a bot to perform this action!',
        );
      }
      const firstMember = req.user.id;
      await guild.members.fetch({
        firstMember,
      });
      const member = guild.members.cache.get(req.user.id);
      if (!member) {
        return errorPage(
          req,
          res,
          'You must be on this server to perform this action!',
        );
      }
      if (!member.permissions.has('ManageGuild')) {
        return errorPage(
          req,
          res,
          'You do not have the ManageGuild permissions!',
        );
      }

      const AntiInviteData = await SchemaAntiInvite.findOne({ guildId: guild.id });
      const AutoRoleData = await SchemaAutoRole.findOne({ guild: guild.id });

      const getAutoMod = await guild.autoModerationRules.fetch({ cache: false });
      const arrayPresets = getAutoMod.map((objeto) => objeto.triggerMetadata.presets);
      const presets = arrayPresets.filter((array) => array.length > 0)[0];

      let PROFANITY = false;
      let SEXUAL_CONTENT = false;
      let SLURS = false;

      if (presets && presets.includes(1)) PROFANITY = true;
      if (presets && presets.includes(3)) SEXUAL_CONTENT = true;
      if (presets && presets.includes(2)) SLURS = true;

      return renderTemplate(res, req, '/server/automod.ejs', {
        guild,
        perms: Discord.PermissionsBitField,
        antiinvite: AntiInviteData,
        autorole: AutoRoleData,
        profanity: PROFANITY,
        insults: SEXUAL_CONTENT,
        sexualcontent: SLURS,
        csrfToken: req.csrfToken(),
      });
    },
  );
  app.post(
    '/dashboard/:guildID/automod',
    csrfProtection,
    checkAuth,
    async (req, res) => {
      const guild = await client.guilds.cache.get(req.params.guildID);
      if (!guild) {
        return errorPage(
          req,
          res,
          'No such server, add a bot to perform this action!',
        );
      }
      const firstMember = req.user.id;
      await guild.members.fetch({
        firstMember,
      });
      const member = guild.members.cache.get(req.user.id);
      if (!member) {
        return errorPage(
          req,
          res,
          'You must be on this server to perform this action!',
        );
      }
      if (!member.permissions.has('ManageGuild')) {
        return errorPage(
          req,
          res,
          'You do not have the ManageGuild permissions!',
        );
      }
      const data = req.body;
      const autoroleRoleFinal = data.autorole_role;
      const profanity = data.profanity_enabled;
      const insults = data.insults_enabled;
      const sexualcontent = data.sexualcontent_enabled;

      if (data) {
        const rules = await guild.autoModerationRules.fetch({ cache: false });
        const existingRule = rules.find((rule) => rule.triggerType === 4);

        if (existingRule) {
          const presets = [];
          if (profanity === 'on') presets.push(1);
          if (sexualcontent === 'on') presets.push(2);
          if (insults === 'on') presets.push(3);

          await existingRule.edit({
            name: 'Block Profanity + Insults & Slurs + Sexual Content (by Scar)',
            enabled: true,
            triggerMetadata: {
              presets,
            },
          });
        } else if (profanity === 'on' && insults === 'on' && sexualcontent === 'on') {
          // Se todas as opções estiverem ativadas
          // Cria as regras de moderação necessárias
          await guild.autoModerationRules.create({
            name: 'Block Profanity + Insults & Slurs + Sexual Content (by Scar)',
            creatorId: '915532683847815198',
            enabled: true,
            eventType: 1,
            triggerType: 4,
            triggerMetadata: {
              presets: [1, 2, 3],
            },
            actions: [{
              type: 1,
            }],
          });
        } else if (profanity === 'on' && insults === 'on') {
          // Se apenas o profanity e insults estiverem ativados
          // Cria as regras de moderação necessárias
          await guild.autoModerationRules.create({
            name: 'Block Profanity + Insults & Slurs (by Scar)',
            creatorId: '915532683847815198',
            enabled: true,
            eventType: 1,
            triggerType: 4,
            triggerMetadata: {
              presets: [1, 3],
            },
            actions: [{
              type: 1,
            }],
          });
        } else if (profanity === 'on' && sexualcontent === 'on') {
          // Se apenas o profanity e sexualcontent estiverem ativados
          // Cria as regras de moderação necessárias
          await guild.autoModerationRules.create({
            name: 'Block Profanity + Sexual Content (by Scar)',
            creatorId: '915532683847815198',
            enabled: true,
            eventType: 1,
            triggerType: 4,
            triggerMetadata: {
              presets: [1, 2],
            },
            actions: [{
              type: 1,
            }],
          });
        } else if (insults === 'on' && sexualcontent === 'on') {
          // Se apenas o insults e sexualcontent estiverem ativados
          // Cria as regras de moderação necessárias
          await guild.autoModerationRules.create({
            name: 'Block Insults & Slurs + Sexual Content (by Scar)',
            creatorId: '915532683847815198',
            enabled: true,
            eventType: 1,
            triggerType: 4,
            triggerMetadata: {
              presets: [2, 3],
            },
            actions: [{
              type: 1,
            }],
          });
        } else if (profanity === 'on') {
          // Se apenas o profanity estiver ativado
          // Cria as regras de moderação necessárias
          await guild.autoModerationRules.create({
            name: 'Block Profanity (by Scar)',
            creatorId: '915532683847815198',
            enabled: true,
            eventType: 1,
            triggerType: 4,
            triggerMetadata: {
              presets: [1],
            },
            actions: [{
              type: 1,
            }],
          });
        } else if (insults === 'on') {
          // Se apenas o insults estiver ativado
          // Cria as regras de moderação necessárias
          await guild.autoModerationRules.create({
            name: 'Block Insults & Slurs (by Scar)',
            creatorId: '915532683847815198',
            enabled: true,
            eventType: 1,
            triggerType: 4,
            triggerMetadata: {
              presets: [3],
            },
            actions: [{
              type: 1,
            }],
          });
        } else if (sexualcontent === 'on') {
          // Se apenas o sexualcontent estiver ativado
          // Cria as regras de moderação necessárias
          await guild.autoModerationRules.create({
            name: 'Block Sexual Content (by Scar)',
            creatorId: '915532683847815198',
            enabled: true,
            eventType: 1,
            triggerType: 4,
            triggerMetadata: {
              presets: [2],
            },
            actions: [{
              type: 1,
            }],
          });
        } else {
          // Se nenhuma opção estiver ativada, não é necessário criar regras de moderação
          console.log('It is not necessary to create moderation rules');
        }

        if (data.antiinvite_enabled) {
          const dataAntiInvite = await SchemaAntiInvite.findOne({ guildId: guild.id });

          if (dataAntiInvite) {
            dataAntiInvite.guildId = guild.id;
            await dataAntiInvite.save();
          } else {
            new SchemaAntiInvite({
              guildId: guild.id,
            }).save();
          }
        } else {
          const dataAntiInvite = await SchemaAntiInvite.findOne({ guildId: guild.id });
          if (dataAntiInvite) await dataAntiInvite.deleteOne();
        }
        if (data.autorole_enabled) {
          const dataAutoRole = await SchemaAutoRole.findOne({ guild: guild.id });

          if (dataAutoRole) {
            dataAutoRole.guild = guild.id;
            dataAutoRole.role = autoroleRoleFinal;
            await dataAutoRole.save();
          } else {
            new SchemaAutoRole({
              guild: guild.id,
              role: autoroleRoleFinal,
            }).save();
          }
        } else {
          const dataAutoRole = await SchemaAutoRole.findOne({ guild: guild.id });
          if (dataAutoRole) await dataAutoRole.deleteOne();
        }
        return res.redirect(`/dashboard/${guild.id}/automod`);
      }
      return true;
    },
  );
  // 404
  app.use((req, res) => {
    res.status(404);
    res.set('Cache-control', 'no-cache, must-revalidate, max-age=0');
    renderTemplate(res, req, '404.ejs');
  });
  // 500
  app.use((error, req, res) => {
    console.error(error);
    res.status(500);
    renderTemplate(res, req, '500.ejs', {
      error: error.message,
    });
  });
  console.log(`> [DASHBOARD] Dashboard is ready on url ${process.env.DOMAIN}`);
};
