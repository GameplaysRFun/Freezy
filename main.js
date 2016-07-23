const Eris = require('eris')
const chalk = require('chalk')
const config = require('./config.json')
const cmd = require('./commands.js')
const pkg = require('./package.json')
const db = require('./db.js')
var info = chalk.bold.green('Info: ')
var error = chalk.bold.red('Error: ')
var warn = chalk.bold.yellow('Warn: ')
var token = config.login.token
var masterUser = config.perms.masterUsers
var stacktrace = config.config.stacktrace
var prefix = config.config.prefix
var bot = new Eris(token)

if (prefix === '>') {
  console.log(warn + "You're using the default '" + prefix + "' prefix for your bot, consider changing it!")
}
var startup = new Date()
console.log(info + 'Loading Freezy ' + pkg.version + '...')
bot.on('ready', () => {
  var ready = new Date() - startup
  console.log(info + 'Logged in as ' + bot.user.username + '#' + bot.user.discriminator + ' (ID: ' + bot.user.id + ')')
  console.log(info + 'Startup took ' + ready + 'ms.')
  bot.editGame({name: pkg.version+'! '+prefix+'ping <3', type: 1, url: 'https://twitch.tv//'})
})

bot.on('messageCreate', (msg) => {
  if (msg.content.startsWith(prefix)) {
    var base = msg.content.substr(prefix.length)
    var stub = base.split(' ')
    var name = stub[0]
    var suffix = base.substr(stub[0].length + 1)
    try {
      var lvl = cmd.execute[name].lvl
      if (msg.channel.guild || masterUser.indexOf(msg.author.id) >= 0) {
        if (lvl >= 1) {
          db.checkIfLvl(msg.channel.guild.id, msg.author.id, lvl).then((pass) => {
            if (pass < lvl) return bot.createMessage(msg.channel.id, "You don't have sufficient permissions!\nThis command requires level " + lvl + ", but you have level " + pass)
            if (pass >= lvl) {
              cmd.execute[name].fn(bot, msg, suffix)
            }
          })
        } else {
          cmd.execute[name].fn(bot, msg, suffix)
        }
      } else {
        bot.createMessage(msg.channel.id, "Can't do this at Direct Messages, silly!")
      }
      console.log(info + msg.author.username + ' executed <' + stub.join(' ') + '>')
    } catch (e) {
      console.log(error + msg.author.username + ' attempt to execute <' + stub.join(' ') + '>')
      if (stacktrace) {
        console.log(error + 'Stacktrace: ' + e.stack)
      } if (!stacktrace) {
        console.log(error + 'Error: ' + e)
      }
    }
  }
})

bot.on('guildCreate', (guild) => {
  db.guildCreation(guild.id, guild.ownerID)
})
bot.on('guildDelete', (guild) => {
  db.guildDeletion(guild.id)
})

bot.connect()