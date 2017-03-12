var shard = parseInt(process.env["SHARD_ID"], 16) + 1;
var shards = parseInt(process.env["SHARD_COUNT"], 16);
var Logger = require("./utils/Logger.js");
Logger.log("Spawned process", `Shard ${shard}: `);
var config = require("./config.json");
var Discord = require("discord.js");
const Client = new Discord.Client({
  shardId: shard - 1,
  shardCount: shards,
});
var commands = new Map();
var aliases = new Map();
var path = require('path');
var fs = require('fs');
var db = require("./utils/DataHandler.js");
setTimeout(() => {
  db.initialize().catch(e => {
    Logger.error("Database Initialization failed\n" + e, `Shard ${shard}: `);
  });
}, config.database.timeout);
/**
 * Load Custom User-made Commands
 **/
var files = fs.readdirSync(path.join(__dirname, "./commands/user"));
for (var i in files) {
  if (files[i].endsWith(".js")) {
    var temp = require(path.join(__dirname, "./commands/user/") + files[i]);
    for (var i in temp) {
      commands.set(i, temp[i]);
    }
  }
}
/**
 * Load normal commands to prevent overlapping
 **/
files = fs.readdirSync(path.join(__dirname, "./commands/"));
for (var i in files) {
  if (files[i].endsWith(".js")) {
    var temp = require(path.join(__dirname, "./commands/") + files[i]); //eslint-disable-line
    for (var i in temp) {
      var cmd = temp[i];
      commands.set(i, cmd);
      if (cmd.aliases) {
        for (var j in cmd.aliases) {
          aliases.set(cmd.aliases[j], i);
        }
      }
    }
  }
}
function updateSites() {
  var request = require('request');
  request({
    method: 'POST',
    json: true,
    url: 'https://bots.discord.pw/api/bots/' + Client.user.id + '/stats',
    headers: {
      'content-type': "application/json",
      'Authorization': config.api.discordbots
    },
    body: {
      shard_count: shards,
      shard_id: shard - 1,
      server_count: Client.guilds.size
    }
  });
}
function antiBotCollection (m, newGuild) {
  var g;
  if (m.constructor.name === "Guild") {
    g = m;
  } else g = m.guild;
  let bots = g.members.filter(user => user.user.bot).size;
  let pr = (bots / g.members.size * 100).toFixed(2);
  if (pr > 70) {
    g.leave();
    Logger.log(g.name + ": Leaving a server with unhealthy human/bot ratio", `Shard ${shard}: `);
    return false;
  } else {
    if (newGuild) Logger.log(g.name + ": Joined a server with safe human/bot ratio", `Shard ${shard}: `);
    return true;
  }
}
Client.login(process.env["TOKEN"]);
Client.on('ready', () => {
  Logger.log("Ready!", `Shard ${shard}: `);
  Client.user.setGame("on Shard " + (shard) + " | " + shards);
  Client.guilds.forEach(g => {antiBotCollection(g, false)});
});
Client.on('disconnect', () => {
  Logger.log("Disconnected!", `Shard ${shard}: `);
});
Client.on("guildCreate", g => {
  if (antiBotCollection(g, true)) {
    var text = [];
    text.push("Hello!");
    text.push("I have joined your server *" + g.name + "*. I'll be giving you a quick tour of most used features.\n");
    text.push("**Voice Functions**");
    text.push(`\`${config.Constants.prefix}voice\` - Makes me join a voice channel. *You have time until waiting music ends to request something*`);
    text.push(`\`${config.Constants.prefix}request\` - You can request anything from most of the modern media sites. *Also supports YouTube playlists and searching*`);
    text.push(`\`${config.Constants.prefix}skip\` - Annoyed by that earrape song someone requested? You can skip it using this command!`);
    text.push(`\`${config.Constants.prefix}queue\` - Check currently queued songs.`);
    text.push("\n**Permissions**");
    text.push(`\`${config.Constants.prefix}setlevel\` - Usage \`<@user> level\` with level being a number. This way you can choose who can use what command.`);
    text.push("\n**Moderation**");
    text.push(`\`${config.Constants.prefix}logs\` - Configure server logging`);
    text.push(`\`${config.Constants.prefix}toggle\` - Configure various functions of the bots to enhance your server!`);
    text.push("\n**Utilities**");
    text.push(`\`${config.Constants.prefix}user\` - Check either your own or mention someone to check their info.`);
    text.push(`\`${config.Constants.prefix}server\` - Get brief information about your server.`);
    text.push("\n**and many many more!** Sadly we can't explain everything in 1 message, as it'd be too large, instead check out `" + config.Constants.prefix + "help` for any further assistance");
    var embed = {
      color: parseInt(config.Constants.embedColor, 16),
      author: {
        name: Client.user.username,
        icon_url: Client.user.displayAvatarURL.replace('.jpg', '.png')
      },
      description: text.join('\n'),
      footer: {
        text: "This command was bot-executed",
        icon_url: Client.user.displayAvatarURL.replace('.jpg', '.png')
      },
    };
    g.owner.sendEmbed(embed);
  }
});
Client.on("guildMemberAdd", m => {
  antiBotCollection(m);
  db.fetchGuildData(m.guild.id).then(r => {
    r.toArray().then(array => {
      if (array[0].options["welcome"] === "true") {
        m.guild.defaultChannel.sendMessage("Welcome **" + m.user.username + "** to **" + m.guild.name + "**! You are the " + ordinalSuffix(m.guild.memberCount) + " member!");
      }
      if (array[0].options["logs"] === "true") {
        var timestamp = new Date(Date.now()).toLocaleTimeString();
        var body = "**" + m.user.username + "#" + m.user.discriminator + "** (" + m.user.id + ") has joined the server! They're the " + ordinalSuffix(m.guild.memberCount) + " member.";
        var joinedMember = "`[" + timestamp + "]` \u{d83d}\u{dc99} " + body;
        if (array[0].options["logs_channel"]) {
          if (Client.channels.has(array[0].options["logs_channel"])) {
            Client.channels.get(array[0].options["logs_channel"]).sendMessage(joinedMember);
          }
        }
      }
    }).catch(e => {});
  }).catch(e => {});
  function ordinalSuffix(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
  }
});
Client.on("guildMemberRemove", m => {
  antiBotCollection(m);
  db.fetchGuildData(m.guild.id).then(r => {
    r.toArray().then(array => {
      if (array[0].options["farewell"] === "true") {
        m.guild.defaultChannel.sendMessage("Goodbye, " + m.user.username + "!");
      }
      if (array[0].options["logs"] === "true") {
        var timestamp = new Date(Date.now()).toLocaleTimeString();
        var body = "**" + m.user.username + "#" + m.user.discriminator + "** (" + m.user.id + ") has left the server!";
        var leftMember = "`[" + timestamp + "]` \u{d83d}\u{dc94} " + body;
        if (array[0].options["logs_channel"]) {
          if (Client.channels.has(array[0].options["logs_channel"])) {
            Client.channels.get(array[0].options["logs_channel"]).sendMessage(leftMember);
          }
        }
      }
    }).catch(e => {});
  }).catch(e => {});
});
Client.on("guildBanAdd", (g, u) => {
  db.fetchGuildData(g.id).then(r => {
    r.toArray().then(array => {
      if (array[0].options["logs"] === "true") {
        var timestamp = new Date(Date.now()).toLocaleTimeString();
        var body = "**" + u.username + "#" + u.discriminator + "** (" + u.id + ") has been **banned from the server**!";
        var banned = "`[" + timestamp + "]` \u{d83d}\u{dd28} " + body;
        if (array[0].options["logs_channel"]) {
          if (Client.channels.has(array[0].options["logs_channel"])) {
            Client.channels.get(array[0].options["logs_channel"]).sendMessage(banned);
          }
        }
      }
    }).catch(e => {});
  }).catch(e => {});
});
Client.on("guildBanRemove", (g, u) => {
  db.fetchGuildData(g.id).then(r => {
    r.toArray().then(array => {
      if (array[0].options["logs"] === "true") {
        var timestamp = new Date(Date.now()).toLocaleTimeString();
        var body = "**" + u.username + "#" + u.discriminator + "** (" + u.id + ") has been unbanned!";
        var banned = "`[" + timestamp + "]` \u{d83d}\u{de4f}\u{d83c}\u{dffc} " + body;
        if (array[0].options["logs_channel"]) {
          if (Client.channels.has(array[0].options["logs_channel"])) {
            Client.channels.get(array[0].options["logs_channel"]).sendMessage(banned);
          }
        }
      }
    }).catch(e => {});
  }).catch(e => {});
});
Client.on("messageDelete", m => {
  if (m.author.bot) return;
  db.fetchGuildData(m.guild.id).then(r => {
    r.toArray().then(array => {
      if (array[0].options["logs"] === "true") {
        var timestamp = new Date(Date.now()).toLocaleTimeString();
        var body = "**" + m.author.username + "#" + m.author.discriminator + "** (" + m.author.id + ")'s message has been deleted from " + m.channel.toString() + "!\n" + m.content.substr(0, 1800);
        var deleted = "`[" + timestamp + "]` \u{274c} " + body;
        if (array[0].options["logs_channel"]) {
          if (m.channel.id === array[0].options["logs_channel"]) return;
          if (Client.channels.has(array[0].options["logs_channel"])) {
            Client.channels.get(array[0].options["logs_channel"]).sendMessage(deleted);
          }
        }
      }
    }).catch(e => {});
  }).catch(e => {});
});
Client.on("messageDeleteBulk", m => {
  var file = [];
  var fileName = m.first().guild.id + "-" + Date.now() + ".txt";
  m.forEach(msg => {
    file.push("[" + new Date(msg.createdAt).toLocaleTimeString() + "] " + msg.author.username + ": " + msg.content);
  });
  file = file.reverse().join("\n");
  fs.writeFile("./logs/" + fileName, file, 'utf-8', function (e) {
    if (e) {
      console.error(e);
    }
    db.fetchGuildData(m.first().guild.id).then(r => {
      r.toArray().then(array => {
        if (array[0].options["logs"] === "true") {
          var timestamp = new Date(Date.now()).toLocaleTimeString();
          var body = "**" + m.size + " messages were deleted from " + m.first().channel.toString() + "**";
          var deleted = "`[" + timestamp + "]` \u{274c} " + body;
          if (array[0].options["logs_channel"]) {
            if (m.first().channel.id === array[0].options["logs_channel"]) return;
            if (Client.channels.has(array[0].options["logs_channel"])) {
              Client.channels.get(array[0].options["logs_channel"]).sendFile(fs.readFileSync("./logs/" + fileName), "deleted-messages.txt", deleted).then(ms => {
                fs.unlinkSync("./logs/" + fileName);
              }).catch(e => {
                fs.unlinkSync("./logs/" + fileName);
                console.error(e);
              });
            }
          }
        }
      }).catch(e => {});
    }).catch(e => {});
  });
});
Client.on("guildDelete", g => {
  updateSites();
  Logger.log("Left " + g.name + ". ", `Shard ${shard}: `);
});
Client.on('message', m => {
  if (!m.author.bot) {
    if (m.content.startsWith(config.Constants.prefix)) {
      if (m.guild) {
        if (!m.guild.members.get(Client.user.id).permissions.hasPermission("SEND_MESSAGES")) {
          return;
        }
      }
      var level = 0;
      var base = m.content.substr(config.Constants.prefix.length).split(" ");
      var cmd = base[0];
      var suffix = m.content.substr(config.Constants.prefix.length + cmd.length + 1);
      if (config.permissions.master.indexOf(m.author.id) > -1) {
        level = 10;
        go();
      } else {
        if (m.guild) {
          if (m.guild.ownerID === m.author.id) {
            level = 5;
            go();
          } else {
            db.fetchGuildData(m.guild.id).then(r => {
              r.toArray().then(a => {
                if (a[0].perms.hasOwnProperty(m.author.id)) {
                  level = a[0].perms[m.author.id].level;
                }
                go();
              }).catch(go);
            }).catch(go);
          }
        } else go();
      }
      function go () { //eslint-disable-line
        if (level < 0) {
          return m.author.sendMessage("**Sorry!** It seems as you are blocked in **" + m.guild.name + "**. Ask the server owner to reset your permissions.\nAdditionaly, you can still use the bot in other servers or through DMs").catch(e => {});
        }
        if (commands.has(cmd) || aliases.has(cmd)) {
          var c;
          if (aliases.has(cmd)) {
            c = commands.get(aliases.get(cmd));
          } else c = commands.get(cmd);
          try {
            if (c.guild && !m.guild) return m.channel.sendMessage(":x: **This command is intended for in-server use!**").catch(e => {});
            if (c.level > level) {
              m.channel.sendMessage(":x: **You do not have sufficient permissions!**\nYou need to be level " + commands.get(cmd).level + ", but you are level " + level + ".");
            } else c.fn(Client, m, suffix, db);
            Logger.log((m.guild ? m.guild.name + ": " : "DM: ") + m.author.username + "#" + m.author.discriminator + " executed <" + cmd + (suffix ? " " + suffix : "") + ">", `Shard ${shard}: `);
          } catch (e) {
            Logger.error((m.guild ? m.guild.name + ": " : "DM: ") + m.author.username + "#" + m.author.discriminator + " failed to execute <" + cmd + (suffix ? " " + suffix : "") + ">", `Shard ${shard}: `);
            Logger.log(e, `Shard ${shard}: `);
          }
        } else if (cmd === "help") {
          if (!commands.has(suffix) && !aliases.has(suffix)) {
            var msgArray = [];
            msgArray.push("**Commands List**\n");
            commands.forEach(function(val, key) {
              if (val.level !== 10 && !val.secret) msgArray.push('**' + key + '** - ' + val.desc);
            });
            msgArray.push("\n**For more specific help with a command, then type in `" + config.Constants.prefix + "help command_name`!**");
            m.author.sendMessage(msgArray.join('\n')).catch(e => {
              if (m.guild) {
                m.channel.sendMessage("**Unable to send help!** Make sure your Direct Messages are turned on!").catch(e => {});
              }
            }).then(msg => {
              if (m.guild) {
                m.channel.sendMessage(":incoming_envelope: **Sent help to your Direct Messages!**").catch(e => {});
              }
            });
            Logger.log((m.guild ? m.guild.name + ": " : "DM: ") + m.author.username + "#" + m.author.discriminator + " executed <" + cmd + (suffix ? " " + suffix : "") + ">", `Shard ${shard}: `);
          } else {
            var c;
            if (aliases.has(suffix)) {
              c = commands.get(aliases.get(suffix));
            } else c = commands.get(suffix);
            if (c.secret) return;
            var fields = [];
            fields.push({
              name: "Origin name",
              value: (aliases.has(suffix) ? aliases.get(suffix) : suffix),
              inline: true
            });
            if (c.aliases) {
              fields.push({
                name: "Aliases",
                value: c.aliases.join(', '),
                inline: true
              });
            }
            if (c.usage) {
              fields.push({
                name: "Usage",
                value: "`" + c.usage + "`",
                inline: true
              });
            }
            if (c.level) {
              fields.push({
                name: "Required Level",
                value: c.level,
                inline: true
              });
            }
            fields.push({
              name: "Guild only",
              value: (c.guild ? "Yes" : "No"),
              inline: true
            });
            var embed = {
              color: parseInt(config.Constants.embedColor, 16),
              author: {
                name: Client.user.username,
                icon_url: Client.user.displayAvatarURL.replace('.jpg', '.png')
              },
              fields,
              footer: {
                text: "This command was user-executed",
                icon_url: Client.user.displayAvatarURL.replace('.jpg', '.png')
              },
            };
            m.author.sendEmbed(embed).catch(e => {
              if (m.guild) {
                m.channel.sendMessage("**Unable to send help!** Make sure your Direct Messages are turned on!").catch(e => {});
              }
            }).then(msg => {
              if (m.guild) {
                m.channel.sendMessage(":incoming_envelope: **Sent help to your Direct Messages!**").catch(e => {});
              }
            });
          }
        }
      }
    }
  }
});
