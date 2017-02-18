module.exports = {
  "setlevel": {
    desc: "Edit someone's level",
    guild: true,
    level: 4,
    fn: function (bot, msg, suffix, db) {
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
          db.editGuildData(msg.guild.id, {user: msg.mentions.users.first().id, level}).then(r => {
            return msg.channel.sendMessage("Successfully edited **" + msg.mentions.users.first().username + "**'s level to " + level).catch(e => {});
          });
        } else return msg.channel.sendMessage(":x: **Must mention someone and append level to it!**").catch(e => {});
      }
    }
  },
  "toggle": {
    desc: "Toggle features for your server",
    guild: true,
    level: 4,
    fn: function (bot, msg, suffix, db) {
      var toggles = ["welcome"];
      var base = suffix.split(' ');
      if (toggles.indexOf(base[0]) > -1) {
        if (base[1] === "false" || base[1] === "true") {
          var statement = true;
          if (base[1] === "false") statement = false;
          db.editGuildData(msg.guild.id, {option: base[0], state: base[1]}).then(r => {
            msg.channel.sendMessage("Successfully set " + base[0] + " to " + statement).catch(e => {});
          });
        } else msg.channel.sendMessage(":x: **Invalid statement!** You have to use either `true` or `false` to change this value.").catch(e => {});
      } else msg.channel.sendMessage(":x: **Invalid option!** Currently available options are `" + toggles.join(', ') + "`").catch(e => {});
    }
  }
};
