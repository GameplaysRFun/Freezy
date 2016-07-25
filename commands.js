const chalk = require('chalk')
const config = require('./config.json')
const db = require('./db.js')
const ytdl = require('ytdl-core')
const ytnode = require('youtube-node')
const YouTube = new ytnode()
YouTube.setKey(config.keys.ytapi)
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
  leave: {
    name: 'Leave',
    help: 'Leaves the server, if unable to do it somehow else.',
    usage: '<leave>',
    lvl: 4,
    fn: function(bot, msg, suffix) {
      bot.leaveGuild(msg.channel.guild.id)
    }
  },
  assign: {
    name: 'Assign',
    help: 'Assigns something. Developer exclusive.',
    usage: '<assign parameter @\u200Bmention>',
    lvl: 9,
    fn: function (bot, msg, suffix) {
      var status = config.server.enabled
      if (status) {
      var official = config.server.id
        if (msg.channel.guild.id === official) {
          var contributor = config.server.contributor
          var staff = config.server.staff
          var base = suffix
          var args = base.split(' ')
          var params = ['contributor', 'staff']
          if (args[0].toLowerCase() === params[0] && msg.mentions.length === 1) {
            bot.editGuildMember(official, msg.mentions[0].id, {roles: [contributor]})
            db.setAchievement(msg.mentions[0].id, params[0], true)
            bot.createMessage(msg.channel.id, msg.mentions[0].username + ' is now a <@&' + contributor + '>!')
          }
          if (args[0].toLowerCase() === params[1] && msg.mentions.length === 1) {
            bot.editGuildMember(official, msg.mentions[0].id, {roles: [staff]})
            db.setAchievement(msg.mentions[0].id, params[0], true)
            db.setAchievement(msg.mentions[0].id, params[1], true)
            bot.createMessage(msg.channel.id, msg.mentions[0].username + ' is now a <@&' + staff + '> member!')
          }
          if (msg.mentions.length !== 1 && params.indexOf(args[0]) <= -1) {
            bot.createMessage(msg.channel.id, "Are you certain, that you're using me properly? Try again.")
          }
        } else {
          bot.createMessage(msg.channel.id, 'This is only applicable at the official server!')
        }
      } else {
        bot.createMessage(msg.channel.id, 'Command disabled! Make sure to configure it before!')
      }
    }
  },
  voice: {
    name: 'Voice',
    help: 'Connects me to a voice channel.',
    usage: '<voice youtube_link>',
    lvl: 1,
    fn: function(bot, msg, suffix) {
      if (!suffix) {
        return bot.createMessage(msg.channel.id, "\u200B**Sorry! Couldn't quite get that, what did you want again?**")
      }
      if (!msg.member.voiceState.channelID) {
        bot.createMessage(msg.channel.id, "\u200B**Can't join a voice channel, if you're not in one yourself!**")
      } else if (msg.member.voiceState.selfDeaf|| msg.member.voiceState.deaf) {
        bot.createMessage(msg.channel.id, "\u200B**Sorry, you're either deafened locally or by server, try again when you're not deafened!**")
      } else {
        bot.joinVoiceChannel(msg.member.voiceState.channelID).then((connection) => {
          if (connection.playing) {
            connection.stopPlaying()
          }
          var infoArray = []
          var info = ytdl.getInfo(suffix, function (e, info) {
            if (e) return (e)
            infoArray.push(info.title)
          })
          var song = ytdl(suffix,{
            quality: 140
          })
          connection.playStream(song)
          setTimeout(() => {
            bot.createMessage(msg.channel.id, `\u200BPlaying **${infoArray[0]}** now..`)
          }, 1250)
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
      var settings = ['welcoming', 'welcome_message', 'farewell_message']
      var args = ['${user}', '${guild}']
      var enable = ['on', 'true', 'enable']
      var disable = ['off', 'false', 'disable']
      var base = suffix
      var split = base.split(' ')
      if (settings.indexOf(split[0].toLowerCase()) <= -1) return bot.createMessage(msg.channel.id, 'Invalid parameter! Please use;\n\n' + settings.join(', '))
      if (settings.indexOf(split[0].toLowerCase()) >= 0) {
        if (enable.indexOf(split[1].toLowerCase()) >= 0) {
          db.setCustomization(msg.channel.guild.id, split[0], true).then((promise) => {
            bot.createMessage(msg.channel.id, 'Server customization settings successfuly edited!')
          })
        }
        if (disable.indexOf(split[1].toLowerCase()) >= 0) {
          db.setCustomization(msg.channel.guild.id, split[0], false).then((promise) => {
            bot.createMessage(msg.channel.id, 'Server customization settings successfuly edited!')
          })
        }
        if (split[0] === 'welcome_message') {
          db.setCustomization(msg.channel.guild.id, split[0], suffix.substr(split[1])).then((promise) => {
            bot.createMessage(msg.channel.id, 'Server customization settings successfuly edited!')
          })
        }
        if (split[0] === 'farewell_message') {
          db.setCustomization(msg.channel.guild.id, split[0], suffix.substr(split[1])).then((promise) => {
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
              bot.editMessage(msg.channel.id, message.id, `**Result:**\n${result}`)
            }
          } catch (e) {
            bot.editMessage(msg.channel.id, message.id, `**Result:**\n${e}`)
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
  achievements: {
    name: 'Achievements',
    help: 'Displays user achievements.',
    usage: '<achievements>',
    lvl: 0,
    fn: function(bot, msg, suffix) {
      var achieveArray = []
      var locked = ':no_entry_sign: Undiscovered Achievement!'
      db.checkAchievement(msg.author.id, 'staff').then((ok) => {
        achieveArray.push(':eyes: **Staff**')
      })
      db.checkAchievement(msg.author.id, 'contributor').then((ok) => {
        achieveArray.push(':green_apple: **Contributor**')
      })
      db.checkAchievement(msg.author.id, 'generated').then((ok) => {
        achieveArray.push(':ok_hand: **First achievement!**')
        bot.createMessage(msg.channel.id, achieveArray.join('\n'))
      }).catch(e => {
        achieveArray.push(':white_check_mark: Generated your UserDB entry. Try typing the command again!')
        bot.createMessage(msg.channel.id, achieveArray.join('\n'))
      })
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
    usage: 'suggest idea',
    lvl: 0,
      fn: function(bot, msg, suffix) {
      var date = new Date(msg.timestamp)
      if (!suffix) {
        bot.createMessage(msg.channel.id, 'You need to add a suggestion first!')
      } else {
        bot.createMessage(msg.channel.id, 'Your suggestion has been sent to the devs!')
        bot.createMessage(config.config.suggest, `**SUGGESTION** | **${msg.author.username} ** | **${date}** | **${suffix}**`)
      }
    }
  },
  ban: {
    name: 'Ban',
    help: 'This command is meant for server staff to ban people.',
    usage: '<ban @\u200Bmention (days)>',
    lvl: 0,
      fn: function(bot, msg, suffix) {
        var base = suffix
        var stub = base.split(' ')
        if (msg.member.permission.json['banMembers']) {
          if (msg.mentions.length === 1 && !isNaN(stub[1])) {
            bot.banGuildMember(msg.channel.guild.id, msg.mentions[0].id, stub[1])
            bot.createMessage(msg.channel.id, 'The user should now be banned, if I had the permissions for it!')
          } else {
            if (isNaN(stub[1])) return bot.createMessage(msg.channel.id, "Your second param is not a number!")
            if (stub[0] !== msg.mentions[0]) bot.createMessage(msg.channel.id, "Your first param isn't a mention!")
          }
        } else {
          bot.createMessage(msg.channel.id, 'Your role does not have enough permissions!')
        }
      }
  },
  kick: {
    name: 'Kick',
    help: 'This command is meant for server staff to kick people.',
    usage: '<kick @\u200Bmention>',
    lvl: 0,
      fn: function(bot, msg, suffix) {
        if (msg.member.permission.json['kickMembers']) {
          if (msg.mentions.length === 1) {
            bot.deleteGuildMember(msg.channel.guild.id, msg.mentions[0].id)
            bot.createMessage(msg.channel.id, 'The user should now be kicked, if I had the permissions for it!')
          }
        } else {
          bot.createMessage(msg.channel.id, 'Your role does not have enough permissions!')
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
        console.log(msg.mentions[0])
        messageArray.push(`Name       | ${msg.mentions[0].username}`)
        messageArray.push(`Id         | ${msg.mentions[0].id}`)
        messageArray.push(`Discrim    | ${msg.mentions[0].discriminator}`)
        messageArray.push(`Created At | ${new Date(msg.mentions[0].createdAt)}`)
        messageArray.push(`Playing    | ${msg.mentions[0].game}`)
        messageArray.push(`Bot       | ${msg.mentions[0].bot}`)
        messageArray.push(`Avatar     | https://cdn.discordapp.com/avatars/${msg.mentions[0].id}/${msg.mentions[0].avatar}.jpg`)
      }
      else if (msg.mentions.length > 1) {
        messageArray.push('You can only mention 1 person!')
      }
      else {
        messageArray.push(`Name       | ${msg.author.username}`)
        messageArray.push(`Id         | ${msg.author.id}`)
        messageArray.push(`Discrim    | ${msg.author.discriminator}`)
        messageArray.push(`Created At | ${new Date(msg.author.createdAt)}`)
        messageArray.push(`Playing    | ${msg.member.game}`)
        messageArray.push(`Bot       | ${msg.author.bot}`)
        messageArray.push(`Avatar     | https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.jpg`)
      }
      messageArray.push('```')
      bot.createMessage(msg.channel.id, messageArray.join('\n'))
    }
  },
    youtube: {
    name: 'Youtube',
    help: 'If you want to search videos quickly via Discord, use this command!',
    usage: '<youtube <search query>>',
    lvl: 0,
    fn: function(bot, msg, suffix) {
      YouTube.search(suffix, 4, function(error, result) {
        if (error) {
          console.log(error)
        } else {
          var rand = Math.floor(Math.random() * (3 - 0 + 0)) + 0
          if (result.items[rand] === undefined) return bot.createMessage(msg.channel.id, 'Something went wrong searching the query!')
          bot.createMessage(msg.channel.id, 'https://www.youtube.com/watch?v=' + result.items[rand].id.videoId)
        }
      })
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
      cmdArray.push(`**${cmds[cmd].name}**\n`)
      cmdArray.push(`**Required level:** ${cmds[cmd].lvl}`)
      cmdArray.push(`**Usage:** ${'`' + cmds[cmd].usage + '`'}`)
      cmdArray.push(`**Description:** ${cmds[cmd].help}`)
    }
  }
  if (cmdArray.length <= 0) {
    return 'No such command!'
  }
  return cmdArray.join('\n')
}

exports.execute = cmds
