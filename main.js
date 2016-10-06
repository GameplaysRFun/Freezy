"use strict"
const Eris = require('eris')
const request = require('request')
const Logger = require('./class/logger.js')
const config = require('./config.json')
const cmd = require('./class/pluginHandler.js')
const pkg = require('./package.json')
const db = require('./class/db.js')
let token = config.login.token
let stacktrace = config.config.stacktrace
let shards = config.config.shards
let prefix = config.config.prefix
let bot = new Eris(token, {maxShards: shards, disableEvents: {'TYPING_START': true, 'PRESENCE_UPDATE': true}})
var appid = ''
bot.vc = []
bot.getOAuthApplication().then((oauth) => {
  appid = oauth.id
})

/*
* Functions corner
* Used to set prototype functions
* which can be used everywhere
* in the file
*/

function checkVersion () {
  request('https://raw.githubusercontent.com/TeamCernodile/Freezy/master/package.json', (error, response, body) => {
    if (error) return Logger.err(error)
    if (response.statusCode === 200) {
      let data = JSON.parse(body)
      if (data.version > pkg.version) Logger.warn('Your copy of Freezy is out of date, please update to version ' + data.version + '!')
    } else {
      return Logger.error('Unable to fetch latest version! Code: ' + response.statusCode)
    }
  })
}
function discordBotsUpdate (auth) {
  if (config.config.discordbots) {
    var postData = {}
    let request = require('request')
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
    setTimeout(() => {
      return Logger.post('Discord Bots - Sent')
    }, 1000) // Ensures POST request is done
  }
}
String.prototype.tagParse = function (guild, member) {
  return this.replaceAll('${atuser}', `<@${member.user.id}>`).replaceAll('${user}', member.user.username).replaceAll('${guild}', guild.name)
}
String.prototype.replaceAll = function (target, replacement) {
  return this.split(target).join(replacement)
}
// Bot
if (prefix === '>') {
  Logger.warn(`You're using the default '${prefix}' prefix for your bot, consider changing it!`)
}
let startup = new Date()
Logger.log(`Loading Freezy ${pkg.version}...`)
bot.on('shardReady', (id) => {
  let ready = new Date() - startup
  Logger.log(`Shard #${id + 1} is ready! Time taken so far ${ready}ms.`)
})
bot.on('ready', () => {
  appid = bot.user.id
  discordBotsUpdate()
  checkVersion()
  let ready = new Date() - startup
  bot.shards.forEach((shard) => {
    shard.editStatus({name: pkg.version + ` | Shard ${shard.id + 1} of ${shards}!`, type: 1, url: 'https://twitch.tv//'})
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
          let subsplit = msg.content.split(' ')
          if (msg.content.startsWith('<@')) {
            base = msg.content.substr(subsplit[0].length + 1)
          }
        }
      }
      let stub = base.split(' ')
      let name = stub[0]
      let suffix = base.substr(stub[0].length + 1)
      try {
        cmd.exec['run'].fn(bot, msg, suffix, name)
        Logger.log(`${msg.author.username} executed <${stub.join(' ')}>`)
      } catch (err) {
          Logger.error(`${msg.author.username} attempted to execute <${stub.join(' ')}>`)
          if (stacktrace) {
            Logger.error(`Stacktrace: ${err.stack}`)
          } if (!stacktrace) {
            Logger.error(`Error: ${err}`)
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
      bot.createMessage(guild.defaultChannel.id, welcomeMsg.tagParse(guild, member))
    })
  })
})
bot.on('guildMemberRemove', (guild, member) => {
  db.checkCustomization(guild.id, 'welcoming').then((promise) => {
    db.checkCustomization(guild.id, 'farewell_message').then((farewellMsg) => {
      bot.createMessage(guild.defaultChannel.id, farewellMsg.tagParse(guild, member))
    })
  })
})
bot.on('warn', (msg, shard) => {
  Logger.warn(`${msg} @ Shard #${shard + 1}`)
})
bot.connect()
