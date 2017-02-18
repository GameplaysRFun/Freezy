var config = require("../config.json");
module.exports = {
  "ping": {
    desc: "Checks my latency",
    level: 0,
    fn: function(bot, msg, suffix) {
      msg.channel.sendMessage("**Calculating...**").then(m => {
        m.edit("", {
          "embed": {
            color: 0x228dc8,
            author: {
              name: bot.user.username,
              icon_url: bot.user.displayAvatarURL.replace('.jpg', '.png')
            },
            description: "My latency is about " + (m.createdAt - msg.createdAt) + "ms.",
            footer: {
              text: "This command was user-executed",
              icon_url: msg.author.displayAvatarURL.replace('.jpg', '.png')
            },
            timestamp: new Date(Date.now()).toISOString()
          }
        }).catch(e => {});
      }).catch(e => {});
    }
  },
  "info": {
    desc: "Shows my general stats.",
    level: 0,
    fn: function (bot, msg, suffix) {
      bot.shard.fetchClientValues("guilds.size").then(guilds => {
        var embed = {
          color: 0x228dc8,
          author: {
            name: bot.user.username,
            icon_url: bot.user.displayAvatarURL.replace('.jpg', '.png')
          },
          thumbnail: {
            url: bot.user.displayAvatarURL.replace('.jpg', '.png')
          },
          fields: [
            {
              name: "Shard",
              value: (parseInt(process.env["SHARD_ID"]) + 1)  + "/" + process.env["SHARD_COUNT"],
              inline: true
            },
            {
              name: "Servers",
              value: guilds.reduce((prev, val) => prev + val, 0),
              inline: true
            },
            {
              name: "Available VC Spots",
              value: (config.Constants.vcPerShard - bot.voiceConnections.size) + " on this shard.",
              inline: true
            }
          ],
          footer: {
            text: "This message was user executed",
            icon_url: msg.author.displayAvatarURL.replace('.jpg', '.png')
          },
          timestamp: new Date(Date.now()).toISOString()
        };
        msg.channel.sendEmbed(embed).catch(e => {});
      }).catch(e => {});
    }
  },
  "invite": {
    desc: "Fancy command to give you information about how to invite me to your server.",
    level: 0,
    fn: function (bot, msg, suffix) {
      bot.fetchApplication("@me").then(r => {
        var qs = "";
        qs += "\nIf you ever get stuck using the bot, visit our [support server](" + config.links.support + ")";
        if (config.links.github) {
          qs += "\nSupport " + bot.user.username + "'s development by contributing to the [source code](" + config.links.github + ")";
        }
        if (config.donation.paypal) {
          qs += "\nIf that's out of bounds for you, you can donate to my [PayPal](" + config.donation.paypal + ")";
        }
        var embed = {
          color: 0x228dc8,
          author: {
            name: bot.user.username,
            icon_url: bot.user.displayAvatarURL.replace('.jpg', '.png')
          },
          thumbnail: {
            url: bot.user.displayAvatarURL.replace('.jpg', '.png')
          },
          description: "You can invite the bot to your server using the [OAuth link](https://discordapp.com/oauth2/authorize?client_id=" + r.id + "&scope=bot)" + qs,
          footer: {
            text: "This message was user executed",
            icon_url: msg.author.displayAvatarURL.replace('.jpg', '.png')
          },
          timestamp: new Date(Date.now()).toISOString()
        };
        msg.channel.sendEmbed(embed).catch(e => {});
      }).catch(e => {});
    }
  },
  "user": {
    desc: "Get details about yourself or someone else",
    level: 0,
    fn: function(bot, msg, suffix) {
      var target = {
        author: msg.author,
        guildPresence: msg.member
      };
      if (msg.mentions.users.size > 0 && msg.guild) {
        target = {
          author: msg.mentions.users.first(),
          guildPresence: msg.guild.members.get(msg.mentions.users.first().id)
        };
      }
      var fields = [
        {
          name: "Username",
          value: '```' + target.author.username + '#' + target.author.discriminator + (target.author.bot ? " <BOT> " : "") + '```',
          inline: true
        },
        {
          name: "ID",
          value: '```' + target.author.id + '```',
          inline: true
        },
        {
          name: "Joined Discord",
          value: '```' + new Date(target.author.createdAt).toUTCString() + '```',
          inline: true
        }
      ];
      if (target.guildPresence) {
        fields.push({
          name: "Roles",
          value: target.guildPresence.roles.array().sort(function(a,b) {return a.position - b.position;}).join(' '),
          inline: false
        });
        fields.push({
          name: "Joined Server",
          value: '```' + new Date(target.guildPresence.joinedAt).toUTCString() + '```',
          inline: true
        });
      }
      var embed = {
        color: 0xffffff,
        author: {
          name: bot.user.username,
          icon_url: bot.user.displayAvatarURL.replace('.jpg', '.png')
        },
        thumbnail: {url: target.author.displayAvatarURL.replace('.jpg', '.png')},
        fields,
        description: "[Avatar URL](" + target.author.displayAvatarURL.replace('.jpg', '.png') + ")",
        footer: {
          text: "This command was user-executed",
          icon_url: msg.author.displayAvatarURL.replace('.jpg', '.png')
        },
        timestamp: new Date(Date.now()).toISOString()
      };
      msg.channel.sendEmbed(embed).catch(e => {});
    }
  },
  "server": {
    desc: "Show general information about the server you're in",
    lvl: 0,
    guild: true,
    fn: function (bot, msg, suffix) {
      var bots = msg.guild.members.filter(user => user.user.bot).size;
      var people = msg.guild.members.size - bots;
      var fields = [
        {
          value: msg.guild.name,
          name: "Name",
          inline: true
        },
        {
          value: msg.guild.id,
          name: "ID",
          inline: true
        },
        {
          value: msg.guild.owner.toString(),
          name: "Owner",
          inline: true
        },
        {
          value: msg.guild.region,
          name: "Region",
          inline: true
        },
        {
          value: msg.guild.joinedAt.toUTCString(),
          name: "Bot Joined",
          inline: true
        },
        {
          value: msg.guild.createdAt.toUTCString(),
          name: "Created At",
          inline: true
        },
        {
          value: msg.guild.members.size,
          name: "Members",
          inline: true
        },
        {
          value: (bots / msg.guild.members.size * 100).toFixed(2) + "%",
          name: "Bots/Human ratio",
          inline: true,
        },
        {
          value: people,
          name: "Human",
          inline: true
        },
        {
          value: bots,
          name: "Bots",
          inline: true
        }];
        if (msg.guild.roles.filter(r => r.name !== "@everyone").array().sort(function(a,b){return a.position - b.position;}).reverse().join(' ').length < 1025) {
          fields.push({
            value: (msg.guild.roles.size ? msg.guild.roles.filter(r => r.name !== "@everyone").array().sort(function(a,b){return a.position - b.position;}).reverse().join(' ') : "None"),
            name: "Roles",
            inline: false
          });
        }
        if (msg.guild.channels.filter(c => c.type === "text").array().sort(function(a,b){return a.position - b.position;}).join(' ').length < 1025) {
          fields.push({
            value: msg.guild.channels.filter(c => c.type === "text").array().sort(function(a,b){return a.position - b.position;}).join(' '),
            name: "Text Channels",
            inline: false
          });
        }
        if (msg.guild.emojis.array().join('').length < 1025) {
          fields.push({
            value: (msg.guild.emojis.size ? msg.guild.emojis.array().join('') : "None"),
            name: "Emojis",
            inline: false
          });
        }
      var embed = {
        color: 0x228dc8,
        author: {
          name: bot.user.username,
          icon_url: bot.user.displayAvatarURL.replace('.jpg', '.png')
        },
        thumbnail: {url: (msg.guild.iconURL ? msg.guild.iconURL.replace('.jpg', '.png') : bot.user.displayAvatarURL.replace('.jpg', '.png'))},
        fields,
        footer: {
          text: "This command was user-executed",
          icon_url: msg.author.displayAvatarURL.replace('.jpg', '.png')
        },
        timestamp: new Date(Date.now()).toISOString()
      };
      msg.channel.sendEmbed(embed).catch(e => {});
    }
  },
  "escape": {
    desc: "Find out a escape sequence for anything!",
    level: 0,
    fn: function (bot, msg, suffix) {
      var input = (suffix ? suffix : "\u{d83e}\u{dd14}");
      var result = "";
      for (var i in input) {
        result += `\\u{${input.charCodeAt(i).toString(16)}}`;
      }
      msg.channel.sendMessage("**Generated output for " + input + "**\n```js\n" + result + "\n```").catch(e => {});
    }
  }
};
