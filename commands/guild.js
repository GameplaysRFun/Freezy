module.exports = {
  "setlevel": {
    desc: "Edit someone's level",
    guild: true,
    level: 4,
    fn: function (bot, msg, suffix, db) {
      db.fetchGuildData(msg.guild.id).then(r => {
        r.toArray().then(re => {
          var g = re[0];
          if (!suffix) {
            msg.channel.sendMessage(":x: **Need context to update data with**").catch(e => {});
          } else {
            if (msg.mentions.users.size > 0) {
              var base = suffix.split(" ");
              var level = parseInt(base[1]); //eslint-disable-line
              if (isNaN(level)) return msg.channel.sendMessage(":x: **Invalid usage!** Proper usage is `setlevel <@mention> level`").catch(e => {});
              if (level > 4) {
                return msg.channel.sendMessage(":x: **Maximum level you can assign is 4**");
              } else if (level < -1) return msg.channel.sendMessage(":x: **Minimum level you can assign is -1**").catch(e => {});
              g.perms[msg.mentions.users.first().id] = {level};
              db.editGuildData(msg.guild.id, g).then(r => {
                return msg.channel.sendMessage("Successfully edited **" + msg.mentions.users.first().username + "**'s level to " + level).catch(e => {});
              });
            } else return msg.channel.sendMessage(":x: **Must mention someone and append level to it!**").catch(e => {});
          }
        });
      }).catch(e => {
        console.log(e);
        return msg.channel.sendMessage(":x: **Sorry!** My database was unable to find information about this server.");
      });
    }
  },
  "logs": {
    desc: "Modify your server log settings.",
    guild: true,
    level: 4,
    fn: function (bot, msg, suffix, db) {
      db.fetchGuildData(msg.guild.id).then(r => {
        r.toArray().then(re => {
          var g = re[0];
          switch (suffix.split(' ')[0]) {
            case 'channel':
              if (msg.mentions.channels.size > 0) {
                g.options["logs_channel"] = msg.mentions.channels.first().id;
                db.editGuildData(msg.guild.id, g).then(r => {
                  return msg.channel.sendMessage("**Server logs will now be output to <#" + msg.mentions.channels.first().id + ">**");
                });
              } else {
                return msg.channel.sendMessage(":x: **Invalid usage!** Please use `logs help` to read more about this command!");
              }
            break;
            case 'help':
              return msg.channel.sendMessage("**Logs help**\n\n`logs channel` - Set your logs channel, appended by channel, example `logs channel #mod-log`\n*To toggle logs on, use `toggle logs true`!*");
            default:
              return msg.channel.sendMessage(":x: **Invalid option!** Please use `logs help`");
          }
        });
      }).catch(e => {
        return msg.channel.sendMessage(":x: **Sorry!** My database was unable to find information about this server.");
      });
    }
  },
  "toggle": {
    desc: "Toggle features for your server",
    guild: true,
    level: 4,
    fn: function (bot, msg, suffix, db) {
      db.fetchGuildData(msg.guild.id).then(r => {
        r.toArray().then(re => {
          var g = re[0];
          var toggles = ["welcome", "logs"];
          var base = suffix.split(' ');
          if (toggles.indexOf(base[0]) > -1) {
            if (base[1] === "false" || base[1] === "true") {
              var statement = true;
              if (base[1] === "false") statement = false;
              g.options[base[0]] = base[1];
              db.editGuildData(msg.guild.id, g).then(r => {
                msg.channel.sendMessage("Successfully set " + base[0] + " to " + statement).catch(e => {});
              });
            } else msg.channel.sendMessage(":x: **Invalid statement!** You have to use either `true` or `false` to change this value.").catch(e => {});
          } else msg.channel.sendMessage(":x: **Invalid option!** Currently available options are `" + toggles.join(', ') + "`").catch(e => {});
        });
      }).catch(e => {
        return msg.channel.sendMessage(":x: **Sorry!** My database was unable to find information about this server.");
      });
    }
  }
};
