const Eris = require('eris')
const Logger = require('./class/logger.js')
const config = require('./config.json')
const cmd = require('./class/commands.js')
const pkg = require('./package.json')
const db = require('./class/db.js')
var token = config.login.token
var masterUser = config.perms.masterUsers
var stacktrace = config.config.stacktrace
var shards = config.config.shards
var prefix = config.config.prefix
var bot = new Eris(token, {maxShards: shards, disableEvents: {'TYPING_START': true, 'PRESENCE_UPDATE': true}})
bot.vc = []
/*
* Functions corner
* Used to set prototype functions
* which can be used everywhere
* in the file
*/
function discordBotsUpdate (auth) {
  if (config.config.discordbots) {
    var postData = {}
    var appid = ''
    if (bot.bot) {
      bot.getOAuthApplication().then((oauth) => {
        appid = oauth.id
      })
    } else {
      appid = bot.user.id
    }
    var request = require('request')
    function post () {
      return request({
        method: 'POST',
        json: true,
        url: 'https://bots.discord.pw/api/bots/' + appid + '/stats',
        headers: {
          'content-type': "application/json",
          'Authorization': config.keys.discordbots
        },
        body: postData
      })
    }
    if (shards >= 2) {
      bot.shards.forEach((shard) => {
        postData = {
          "shard_id": shard.id,
          "shard_count": shards,
          "server_count":  shard.guildCount
        }
        post()
      })
    } else {
      bot.shards.forEach((shard) => {
        postData['server_count'] = shard.guildCount
        post()
      })
    }
  }
}
String.prototype.replaceAll = function (target, replacement) {
  return this.split(target).join(replacement)
}
// Bot
if (prefix === '>') {
  Logger.warn(`You're using the default '${prefix}' prefix for your bot, consider changing it!`)
}
var startup = new Date()
Logger.log(`Loading Freezy ${pkg.version}...`)
bot.on('shardReady', (id) => {
  var ready = new Date() - startup
  Logger.log(`Shard #${id + 1} is ready! Time taken so far ${ready}ms.`)
})
bot.on('ready', () => {
  discordBotsUpdate()
  var ready = new Date() - startup
  bot.shards.forEach((shard) => {
    shard.editGame({name: pkg.version + ` | Shard ${shard.id + 1} of ${shards}!`, type: 1, url: 'https://twitch.tv//'})
  })
  if (!bot.bot) Logger.warn(`Not a OAuth application! Consider using OAuth application, unless it's a private selfbot!`)
  Logger.log(`Logged in as ${bot.user.username}#${bot.user.discriminator} (ID: ${bot.user.id})`)
  Logger.log(`Startup took ${ready}ms.`)
})

bot.on('messageCreate', (msg) => {
  if (!msg.author.bot) {
    if (msg.content.startsWith(prefix) || msg.mentions.length === 1 && msg.mentions[0].id == bot.user.id) {
      var base = msg.content.substr(prefix.length)
      if (msg.mentions.length === 1)  {
        if (msg.mentions[0].id === bot.user.id) {
          var subsplit = msg.content.split(' ')
          if (msg.content.startsWith('<@')) {
            base = msg.content.substr(subsplit[0].length + 1)
          }
        }
      }
      var stub = base.split(' ')
      var name = stub[0]
      var suffix = base.substr(stub[0].length + 1)
      try {
        var lvl = cmd.execute[name].lvl
        if (msg.channel.guild) {
          if (lvl >= 1) {
            db.checkIfLvl(msg.channel.guild.id, msg.author.id, lvl).then((pass) => {
              if (pass < lvl) return bot.createMessage(msg.channel.id, "You don't have sufficient permissions!\nThis command requires level " + lvl + ", but you have level " + pass)
              if (pass >= lvl) {
                cmd.execute[name].fn(bot, msg, suffix)
              }
            }).catch(() => {
              bot.createMessage(msg.channel.id, 'Detected missing database entry.. **Fixing it!**\nFeel free to use me again!')
              db.guildCreation(msg.channel.guild.id, msg.channel.guild.ownerID)
            })
          } else {
            cmd.execute[name].fn(bot, msg, suffix)
          }
        } else {
          bot.createMessage(msg.channel.id, "Can't do this at Direct Messages, silly!")
        }
        Logger.log(`${msg.author.username} executed <${stub.join(' ')}>`)
      } catch (e) {
        Logger.error(`${msg.author.username} attempt to execute <${stub.join(' ')}>`)
        if (cmd.execute[name] !== null) {
          if (stacktrace) {
            Logger.error(`Stacktrace: ${e.stack}`)
          } if (!stacktrace) {
            Logger.error(`Error: ${e}`)
          }
        }
      }
    }
  }
})

bot.on('guildCreate', (guild) => {
  discordBotsUpdate()
  db.guildCreation(guild.id, guild.ownerID)
})
bot.on('guildDelete', (guild) => {
  discordBotsUpdate()
  db.guildDeletion(guild.id)
})
bot.on('guildMemberAdd', (guild, member) => {
  db.checkCustomization(guild.id, 'welcoming').then((promise) => {
    db.checkCustomization(guild.id, 'welcome_message').then((welcomeMsg) => {
      bot.createMessage(guild.defaultChannel.id, welcomeMsg.replaceAll('${user}', `<@${member.user.id}>`).replaceAll('${guild}', guild.name))
    })
  })
})
bot.on('guildMemberRemove', (guild, member) => {
  db.checkCustomization(guild.id, 'welcoming').then((promise) => {
    db.checkCustomization(guild.id, 'farewell_message').then((farewellMsg) => {
      bot.createMessage(guild.defaultChannel.id, farewellMsg.replaceAll('${user}', `<@${member.user.id}>`).replaceAll('${guild}', guild.name))
    })
  })
})
bot.on('warn', (msg, shard) => {
  Logger.warn(`${msg} @ Shard #${shard + 1}`)
})

bot.connect()
