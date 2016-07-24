const chalk = require('chalk')
const config = require('./config.json')
const db = require('./db.js')
var prefix = config.config.prefix
var masterUser = config.perms.masterUsers
var warn = chalk.bold.yellow('Warn: ')

var cmds = {
  ping: {
    name: 'Ping',
    help: 'Ping Pong!',
    usage: '<ping>',
    lvl: 0,
    fn: function(bot, msg, suffix) {
      var pingArray = ['Ping!', 'Peng!', 'Pang!', 'Pong!', 'Poot!', 'Noot!']
      var random = Math.floor(pingArray.length * Math.random())
      if (random > pingArray.length) {
        random = 3
        console.log(warn + 'Someone got unexpected ping response, retrieving "Pong!".')
      }
      var time1 = new Date()
      bot.createMessage(msg.channel.id, '\u200B' + pingArray[random]).then(message => {
        var final = new Date() - time1
        bot.editMessage(msg.channel.id, message.id, '\u200B' + pingArray[random] + ' Time taken: ' + final + 'ms.')  
      })
    }
  },
  voice: {
    name: 'Voice',
    help: 'Connects me to a voice channel.',
    usage: '<voice>',
    lvl: 1,
    fn: function(bot, msg, suffix) {
      if(!msg.member.channelID) {
        bot.createMessage(msg.channel.id, "\u200B**Can't join a voice channel, if you're not in one yourself!**")
      } else if (msg.member.selfDeaf || msg.member.deaf) {
        bot.createMessage(msg.channel.id, "\u200B**Sorry, you're either deafened locally or by server, try again when you're not deafened!**")
      } else {
        bot.joinVoiceChannel(msg.member.channelID).then((connection) => {
          bot.createMessage(msg.channel.id, "\u200B**Joined the voice channel you're currently in!**")
          if (connection.playing) {
            connection.stopPlaying()
          }
          connection.playFile('./song.mp3') // re-enable if you got song only!
        })
      }
    }
  },
  setlevel: {
    name: 'Setlevel',
    help: 'Sets someone permission level.',
    usage: '<setlevel @\u200Bmention level>',
    lvl: 3,
    fn: function(bot, msg, suffix) {
      var base = suffix
      var userid = false
      if (msg.mentions.length === 1) {
        userid = msg.mentions[0]
      }
      var split = base.split(' ')
      split[0] = userid
      var lvl = split[1]
      if (isNaN(lvl)) return bot.createMessage(msg.channel.id, 'Uh oh! It seems as you attempted to break the system!')
      if (userid !== false && userid !== undefined && lvl >= 0) {
        db.changeLvl(msg.channel.guild.id, userid, lvl).then((promise) => {
          bot.createMessage(msg.channel.id, '**Success!** Permissions should be successfuly edited now!')
        }).catch(e => {console.log(e)})
      } else return bot.createMessage(msg.channel.id, 'Missing something! Are you sure you mentioned someone first, and entered the level number after it?')
    }
  },
  owner: {
    name: 'Owner',
    help: 'Checks if you have server owner permissions!',
    usage: '<owner>',
    lvl: 4,
    fn: function(bot, msg, suffix) {
      if (msg.channel.guild) {
        if (masterUser.indexOf(msg.author.id) >= 0) return bot.createMessage(msg.channel.id, 'You have masteruser permissions.')
        bot.createMessage(msg.channel.id, 'You have level 4 permissions.')
      } else {
        bot.createMessage(msg.channel.id, "You can't do this at Direct Messages, silly!")
      }
    }
  },
  customize: { // DIRTY! Needs rework later.
    name: 'Customize',
    help: 'Customizes the server preferences',
    usage: '<customize option value>',
    lvl: 3,
    fn: function(bot, msg, suffix) {
      var settings = ['welcoming']
      var enable = ['on', 'true', 'enable']
      var disable = ['off', 'false', 'disable']
      var base = suffix
      var split = base.split(' ')
      if (enable.indexOf(split[1].toLowerCase()) <= -1 && disable.indexOf(split[1].toLowerCase()) <= -1) return bot.createMessage(msg.channel.id, 'Invalid parameter! Please use something logical like "on", "true", "off", "false"!')
      if (settings.indexOf(split[0].toLowerCase()) <= -1) return bot.createMessage(msg.channel.id, 'Invalid parameter! Please use;\n\n' + settings.join(', '))
      if (settings.indexOf(split[0].toLowerCase()) >= 0) {
        if(enable.indexOf(split[1].toLowerCase()) >= 0) {
          db.setCustomization(msg.channel.guild.id, split[0], true).then((promise) => {
            bot.createMessage(msg.channel.id, 'Server customization settings successfuly edited!')
          })
        }
        if (disable.indexOf(split[1].toLowerCase()) >= 0) {
          db.setCustomization(msg.channel.guild.id, split[0], false).then((promise) => {
            bot.createMessage(msg.channel.id, 'Server customization settings successfuly edited!')
          })
        }
      }
    }
  },
  eval: {
    name: 'Eval',
    help: 'Evaluates code. Developer exclusive!',
    usage: '<eval javaScript_code>',
    lvl: 9,
    fn: function(bot, msg, suffix) {
        bot.createMessage(msg.channel.id, '\u200B**Evaluating...**').then((message) => {
          try {
            var result = eval(suffix) // eslint-disable-line
            if (typeof result !== 'object') {
              bot.editMessage(msg.channel.id, message.id, '**Result:**\n' + result)
            }
          } catch (e) {
            bot.editMessage(msg.channel.id, message.id, '**Result:**\n' + e)
          }
        })
    }
  },
  help: {
    name: 'Help',
    help: 'The command you are using right now!',
    usage: '<help command_name>',
    lvl: 0,
    fn: function(bot, msg, suffix) {
      if (!suffix) { // DIRTY
        bot.createMessage(msg.channel.id, getCommandsName())
      } else {
        bot.createMessage(msg.channel.id, getCommandsHelp(suffix))
      }
    }
  },
  hi: {
    name: 'Hi',
    help: 'Just saying hi is nice! Freezy does not have many friends...',
    usage: '<hi>',
    lvl: 0,
    fn: function(bot, msg, suffix) {
      var sentences = ['Oh... Hello! I did not see you there... Probably because i am a bot.', 'Well hello there little fellow! Do you want some candy and com in my van?', 'I am not allowed to talk to strangers from my creator! I am sorry...', 'Hmm... Do you want to build a snowman? If not... I dont like you >:(']
      var random = Math.floor((Math.random() * sentences.length))
      if (random > sentences.length) {
        random = 1
      }
      bot.createMessage(msg.channel.id, sentences[random])
    }
  },
  suggest: {
    name: 'Suggest',
    help: 'You have a great idea for the bot? This command sends that idea to the devs!',
    usage: '<suggest idea>',
    lvl: 0,
    fn: function(bot, msg, suffix) {
      var date = new Date(msg.timestamp)
      if (!suffix) {
        bot.createMessage(msg.channel.id, 'You need to add a suggestion first! Use it like this: `>suggest This is a idea for the bot!`')
      } else {
        bot.createMessage(msg.channel.id, 'Your suggestion has been sent to the devs!')
        bot.createMessage('206496656777150464', '**SUGGESTION** | **' + msg.author.username + '** | **' + date + '** | **' + suffix + '**')
      }
    }
  },
  userinfo: {
    name: 'Userinfo',
    help: 'You need seme info about yourself or someone else? Then this is the command you need!',
    usage: '<userinfo mention>',
    lvl: 0,
    fn: function(bot, msg, suffix) {
      var messageArray = []
      messageArray.push('```diff')
      if (msg.mentions.length == 1) {
        messageArray.push('Name       | ' + msg.mentions[0].username)
        messageArray.push('Id         | ' + msg.mentions[0].id)
        messageArray.push('Discrim    | ' + msg.mentions[0].discriminator)
        messageArray.push('Created At | ' + new Date(msg.mentions[0].createdAt))
        messageArray.push('Bot?       | ' + msg.mentions[0].bot + '**')
        messageArray.push('Avatar     | ' + 'https://cdn.discordapp.com/avatars/' + msg.mentions[0].id + '/' + msg.mentions[0].avatar + '.jpg')
      }
      else if (msg.mentions.length > 1) {
        messageArray.push('You can only mention 1 person!')
      }
      else {
        messageArray.push('Name       | ' + msg.author.username)
        messageArray.push('Id         | ' + msg.author.id + '**')
        messageArray.push('Discrim    | ' + msg.author.discriminator)
        messageArray.push('Created At | ' + new Date(msg.author.createdAt))
        messageArray.push('Bot?       | ' + msg.author.bot +)
        messageArray.push('Avatar     | ' + 'https://cdn.discordapp.com/avatars/' + msg.author.id + '/' + msg.author.avatar + '.jpg')
      }
      messageArray.push('```')
      bot.createMessage(msg.channel.id, messageArray.join('\n'))
    }
  }
}

function getCommandsName () { // DIRTY
  var cmdArray = []
  var helpArray = []
  helpArray.push('**Commands list**')
  for (var cmd in cmds) {
    cmdArray.push(cmds[cmd].name.toLowerCase())
  }
  helpArray.push(cmdArray.sort().join(', '))
  helpArray.push("If you'd like to know more about a specific command, please type in `" + prefix + "help commands name`!")
  return helpArray.join('\n\n')
}
function getCommandsHelp (command) { // DIRTY
  var cmdArray = []
  for (var cmd in cmds) {
    if (cmds[cmd].name.toLowerCase() === command.toLowerCase()) {
      cmdArray.push('**' + cmds[cmd].name + '**\n')
      cmdArray.push('**Required level:** ' + cmds[cmd].lvl)
      cmdArray.push('**Usage:** `' + cmds[cmd].usage + '`')
      cmdArray.push('**Description:** ' + cmds[cmd].help)
    }
  }
  if (cmdArray.length <= 0) {
    return 'No such command!'
  }
  return cmdArray.join('\n')
}

exports.execute = cmds
