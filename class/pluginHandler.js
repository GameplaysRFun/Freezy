const fs = require('fs')
const Logger = require('./logger.js')
const db = require('./db.js')
const plugins = fs.readdirSync('./class/plugins/')
exports.exec = {
  run: {
    fn: function (bot, msg, suffix, name) {
      if (name.toLowerCase() === 'plugins') {
        var k = []
        for (var i in plugins) {
          var info = require('./plugins/' + plugins[i]).info
          k.push('**' + info.name + '** > ' + info.description + ' < *made by ' + info.owner + '*')
        }
        bot.createMessage(msg.channel.id, '**Plugins loaded**\n\n' + k.join('\n'))
      } else {
        try {
          if (msg.channel.guild) {
            db.checkIfLvl(msg.channel.guild.id, msg.author.id).then((lvl) => {
              for (var i in plugins) {
                var cmd = require('./plugins/' + plugins[i])
                if (cmd.exec[name] !== undefined) {
                  if (cmd.exec[name].lvl <= lvl) return cmd.exec[name].fn(bot, msg, suffix)
                  else return bot.createMessage(msg.channel.id, ':x: **No sufficient permissions!** This command requires level ' + cmd.exec[name].lvl + ', but you are level ' + lvl + '.')
                }
              }
            })
          } else {
            for (var i in plugins) {
              var cmd = require('./plugins/' + plugins[i])
              if (cmd.exec[name] !== undefined) {
                if (!cmd.exec[name].guildOnly && cmd.exec[name].lvl == 0) return cmd.exec[name].fn(bot, msg, suffix)
                else return bot.createMessage(msg.channel.id, ':x: **Oops!** This command is only allowed to be used in a server!')
              }
            }
          }
        } catch (e) {
          // Nothing?
        }
      }
    }
  }
}
