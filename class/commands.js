const Logger = require('./logger.js')
const config = require('../config.json')
const db = require('./db.js')
const ytdl = require('ytdl-core')
const ytnode = require('youtube-node')
const YouTube = new ytnode()
const pkg = require('../package.json')
YouTube.setKey(config.keys.ytapi)
var prefix = config.config.prefix
var masterUser = config.perms.masterUsers

/*
* Functions corner
* Used to set prototype functions
* which can be used everywhere
* in the file
*/
String.prototype.replaceAll = function (target, replacement) {
  return this.split(target).join(replacement)
}
String.prototype.firstUpperCase = function () {
    return this.charAt(0).toUpperCase() + this.substring(1);
}
// Commands
exports.execute = {
  ping: {
    name: 'Ping',
    help: 'Ping Pong!',
    usage: '<ping>',
    guildOnly: false,
    lvl: 0,
    fn: function (bot, msg, suffix) {
      var pingArray = ['Ping!', 'Peng!', 'Pang!', 'Pong!', 'Poot!', 'Noot!']
      var random = Math.floor(pingArray.length * Math.random())
      if (random > pingArray.length) {
        random = 3
        Logger.warn('Someone got unexpected ping response, retrieving "Pong!".')
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
    guildOnly: true,
    lvl: 4,
    fn: function (bot, msg, suffix) {
      bot.leaveGuild(msg.channel.guild.id)
    }
  },
  assign: {
    name: 'Assign',
    help: 'Assigns something. Developer exclusive.',
    usage: '<assign parameter @\u200Bmention>',
    guildOnly: true,
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
            if (args[1].toLowerCase() === 'promote') {
              bot.editGuildMember(official, msg.mentions[0].id, {roles: [contributor]})
              bot.createMessage(msg.channel.id, msg.mentions[0].username + ' is now a <@&' + contributor + '>!')
            } else {
              bot.createMessage(msg.channel.id, msg.mentions[0].username + ' is now either demoted or a contributor!')
            }
            db.setAchievement(msg.mentions[0].id, params[0])
          }
          if (args[0].toLowerCase() === params[1] && msg.mentions.length === 1) {
            if (args[1].toLowerCase() === 'promote') {
              bot.editGuildMember(official, msg.mentions[0].id, {roles: [staff]})
              bot.createMessage(msg.channel.id, msg.mentions[0].username + ' is now a <@&' + staff + '> member!')
            } else {
              bot.createMessage(msg.channel.id, msg.mentions[0].username + ' is now either demoted or a staff member!')
            }
            db.setAchievement(msg.mentions[0].id, params[1])
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
    guildOnly: true,
    lvl: 1,
    fn: function (bot, msg) {
      bot.voiceConnections.forEach((vc) => {
        if (msg.member.voiceState.channelID.indexOf(vc.channelID) >= 0) {
          return bot.createMessage(msg.channel.id, 'Already in the voice channel!')
        }
      })
      if (msg.member.voiceState.channelID === null) {
        bot.createMessage(msg.channel.id, "\u200B**Can't join a voice channel, if you're not in one yourself!**")
      } else if (msg.member.voiceState.selfDeaf|| msg.member.voiceState.deaf) {
        bot.createMessage(msg.channel.id, "\u200B**Sorry, you're either deafened locally or by server, try again when you're not deafened!**")
      } else {
        var k = msg.member.voiceState.channelID
        bot.joinVoiceChannel(msg.member.voiceState.channelID).then((conn) => {
          bot.createMessage(msg.channel.id, 'Joined the voice channel you\'re in right now!')
        })
      }
    }
  },
  playlist: {
    name: 'Playlist',
    help: 'Shows current playlist.',
    usage: '<playlist>',
    guildOnly: true,
    lvl: 1,
    fn: function (bot, msg, suffix) {
      bot.voiceConnections.forEach((vc) => {
        if (msg.member.voiceState.channelID.indexOf(vc.channelID) >= 0) {
          if (vc.queue[0] === undefined) return bot.createMessage(msg.channel.id, '**Currently not queueing anything**')
          var playlist = []
          var name = ''
          for (var i in vc.queue) {
            var requester = msg.channel.guild.members.get(vc.queue[i][3])
            name = requester.nick + '#' + requester.user.discriminator + ' (ID: ' + requester.user.id + ')'
            if (requester.nick === null) name = requester.user.username + '#' + requester.user.discriminator + ' (ID: ' + requester.user.id + ')'
            playlist.push('- `[' + vc.queue[i][2] + ']` **' + vc.queue[i][1] + '** by *' + name + '*')
          }
          bot.createMessage(msg.channel.id, '**Enqueued songs**\n\n' + playlist.join('\n'))
        }
      })
    }
  },
  volume: {
    name: 'Volume',
    help: 'Sets a song volume.',
    usage: '<volume %>',
    guildOnly: true,
    lvl: 1,
    fn: function (bot, msg, suffix) {
      bot.voiceConnections.forEach((vc) => {
        if (msg.member.voiceState.channelID.indexOf(vc.channelID) >= 0) {
          if (!isNaN(parseInt(suffix))) {
            if (parseInt(suffix) <= 100) {
              vc.setVolume(Math.abs(parseInt(suffix) / 100))
              bot.createMessage(msg.channel.id, '**Set the volume of current active stream to ' + parseInt(suffix) + '%!**')
            } else {
              bot.createMessage(msg.channel.id, '**Specified percentage is too high!**')
            }
          } else return bot.createMessage(msg.channel.id, '**Not a number!** Try using a valid number between 0 and 100!')
        } else {
          bot.createMessage(msg.channel.id, '**Not in the voice channel you\'re in!**')
        }
      })
    }
  },
  request: {
    name: 'Request',
    help: 'Requests a song.',
    usage: '<request youtube link>',
    guildOnly: true,
    lvl: 1,
    fn: function (bot, msg, suffix) {
      bot.voiceConnections.forEach((vc) => {
        if (msg.member.voiceState.channelID.indexOf(vc.channelID) > -1) {
          if (vc.queue === undefined) vc.queue = []
          if (vc.playing) {
            ytdl.getInfo(suffix, (e, info) => {
              if (e) return bot.createMessage(msg.channel.id, 'Unable to queue this song!')
              var min = Math.floor(info.length_seconds / 60)
              var sec = Math.floor(info.length_seconds % 60)
              if (min < 10) min = '0' + Math.floor(info.length_seconds / 60)
              if (sec < 10) sec = '0' + Math.floor(info.length_seconds % 60)
              var parsedTime = min + ':' + sec
              if (info.title.length > 34 && info.title.lastIndexOf(info.title) !== info.title.length) info.title = info.title.substr(0, 35) + '...'
              vc.queue.push([suffix, info.title, parsedTime, msg.author.id])
              bot.createMessage(msg.channel.id, 'Requested and enqueued **' + info.title+ '** in position **#' + vc.queue.length + '**')
            })
          } else {
            var song = ''
            function play (link) {
              song = ytdl(link, {audioonly: true})
              vc.playStream(song, {inlineVolume: false})
              vc.on('error', (e) => {
                bot.createMessage(msg.channel.id, 'DEBUG: ' + e.stack)
              })
              if (vc.queue.length === 0) {
                ytdl.getInfo(link, (e, info) => {
                  if (e) return bot.createMessage(msg.channel.id, 'Encountered an error in parsing the video!')
                  var min = Math.floor(info.length_seconds / 60)
                  var sec = Math.floor(info.length_seconds % 60)
                  if (min < 10) min = '0' + Math.floor(info.length_seconds / 60)
                  if (sec < 10) sec = '0' + Math.floor(info.length_seconds % 60)
                  var parsedTime = min + ':' + sec
                  var songName = info.title
                  if (songName.length >= 35) songName = info.title.substr(0, 35) + '...'
                  bot.createMessage(msg.channel.id, '`[' + parsedTime + ']` Now playing **' + songName + '** requested by ' + msg.author.username + '#' + msg.author.discriminator + ' (' + msg.author.id + ')...')
                })
              } else {
                var next = ''
                function getName (pos) {
                  if (!pos) pos = 0
                  return msg.channel.guild.members.get(vc.queue[pos][3]).user.username + '#' + msg.channel.guild.members.get(vc.queue[pos][3]).user.discriminator + ' (' + msg.channel.guild.members.get(vc.queue[pos][3]).user.id + ')'
                }
                if (vc.queue.length > 1) next = '\nUp next in the queue is **' + vc.queue[1][1] + '**...'
                bot.createMessage(msg.channel.id, '`[' + vc.queue[0][2] + ']` Now playing **' + vc.queue[0][1] + '** requested by ' + getName(0) + '...' + next)
              }
              song.once('end', () => {
                if (vc.queue.length > 0) {
                  play(vc.queue[0][0])
                  return vc.queue.shift()
                } else {
                  vc.queueRequired = false
                  vc.disconnect()
                  return bot.createMessage(msg.channel.id, 'All songs in the queue have been played, leaving voice channel!')
                }
              })
            }
            play(suffix)
          }
        } else {
          if (vc.id === msg.channel.guild.id) {
            bot.createMessage(msg.channel.id, '**Not in the voice channel you\'re in!**')
          }
        }
      })
    }
  },
  setlevel: {
    name: 'Setlevel',
    help: 'Sets someone permission level.',
    usage: '<setlevel @\u200Bmention level>',
    guildOnly: true,
    lvl: 3,
    fn: function (bot, msg, suffix) {
      var base = suffix
      var userid = false
      if (msg.mentions.length === 1) {
        userid = msg.mentions[0].id
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
    guildOnly: true,
    lvl: 4,
    fn: function (bot, msg, suffix) {
      if (masterUser.indexOf(msg.author.id) >= 0) return bot.createMessage(msg.channel.id, 'You have masteruser permissions.')
      bot.createMessage(msg.channel.id, 'You have level 4 permissions.')
    }
  },
  say: {
    name: 'Say',
    help: 'You can make bot say ANYTHING!',
    usage: '<say suffix>',
    guildOnly: false,
    lvl: 0,
    fn: function (bot, msg, suffix) {
      bot.createMessage(msg.channel.id, '\u200B' + suffix)
    }
  },
  customize: { // DIRTY! Needs rework later.
    name: 'Customize',
    help: 'Customizes the server preferences',
    usage: '<customize option value>',
    guildOnly: true,
    lvl: 3,
    fn: function (bot, msg, suffix) {
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
    guildOnly: false,
    fn: function (bot, msg, suffix) {
        bot.createMessage(msg.channel.id, '\u200B**Evaluating...**').then((message) => {
          try {
            var result = eval(suffix) // eslint-disable-line
            if (typeof result !== 'object') {
              bot.editMessage(msg.channel.id, message.id, `**Result:**\n${result}`)
            }
          } catch (e) {
            bot.editMessage(msg.channel.id, message.id, `**Result:**\n\`\`\`js\n${e.stack}\`\`\``)
          }
        })
    }
  },
  help: {
    name: 'Help',
    help: 'The command you are using right now!',
    usage: '<help command_name>',
    lvl: 0,
    guildOnly: false,
    fn: function (bot, msg, suffix) {
      if (!suffix) { // DIRTY
        bot.getDMChannel(msg.author.id).then((DMChannel) => {
          if (msg.channel.guild) bot.createMessage(msg.channel.id, '**Sent you a direct message of my commands!**')
          bot.createMessage(DMChannel.id, getCommandsName())
        }).catch((e) => {
          bot.createMessage(msg.channel.id, 'ERROR recieving DM Channel:\n' + e.stack)
        })
      } else {
        bot.getDMChannel(msg.author.id).then((DMChannel) => {
          if (msg.channel.guild) bot.createMessage(msg.channel.id, '**Sent you a direct message of what you requested!**')
          bot.createMessage(DMChannel.id, getCommandsHelp(suffix))
        }).catch((e) => {
          bot.createMessage(msg.channel.id, 'ERROR recieving DM Channel:\n' + e.stack)
        })
      }
    }
  },
  achievements: {
    name: 'Achievements',
    help: 'Displays user achievements.',
    usage: '<achievements>',
    lvl: 0,
    guildOnly: false,
    fn: function (bot, msg, suffix) {
      var achieveArray = []
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
    guildOnly: false,
    fn: function (bot, msg, suffix) {
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
    guildOnly: false,
    lvl: 0,
      fn: function (bot, msg, suffix) {
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
    guildOnly: true,
    lvl: 0,
      fn: function (bot, msg, suffix) {
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
    guildOnly: true,
    lvl: 0,
      fn: function (bot, msg, suffix) {
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
    guildOnly: true,
    lvl: 0,
    fn: function (bot, msg, suffix) {
      function checkGame (type, game) {
        return `${type ? 'Playing: ' : 'Streaming: '}**${game}**`
      }
      function getAvy (type) {
        if (type === 'self') {
          if (msg.author.avatar !== null) messageArray.push(`-> Avatar: ${msg.author.avatarURL}`)
          if (msg.author.avatar === null) messageArray.push(`-> Avatar: ${msg.author.defaultAvatarURL}`)
        } else {
          if (msg.mentions[0].avatar !== null) messageArray.push(`-> Avatar: ${msg.mentions[0].avatarURL}`)
          if (msg.mentions[0].avatar === null) messageArray.push(`-> Avatar: ${msg.mentions[0].defaultAvatarURL}`)
        }
      }
      function parseRoles () {
        var d = []
        msg.channel.guild.roles.forEach((role) => {
          if (roles.indexOf(role.id) >= 0) {
            d.push(role.name)
          }
        })
        return d.join(', ')
      }
      var type = 'self'
      var messageArray = []
      var userid = msg.author.id
      var roles = msg.member.roles
      messageArray.push('**==> Requested information <==**\n')
      if (msg.mentions.length == 1) {
        userid = msg.mentions[0].id
        var type = 'mention'
        var mentioned = msg.channel.guild.members.get(msg.mentions[0].id)
        roles = mentioned.roles
        messageArray.push(`-> Name: **${msg.mentions[0].username}**`)
        if (mentioned.nick !== null) messageArray.push(`-> Nick: **${mentioned.nick}**`)
        messageArray.push(`-> Id: **${mentioned.id}**`)
        messageArray.push(`-> Discrim: **${msg.mentions[0].discriminator}**`)
        messageArray.push(`-> Created At: **${new Date(msg.mentions[0].createdAt)}**`)
        if (msg.channel.guild) {
          messageArray.push('-> Joined Server At: **' + new Date(mentioned.joinedAt) + '**')
          messageArray.push('-> Roles: **' + parseRoles() + '**')
        }
        if (mentioned.game !== null) messageArray.push('-> ' + checkGame(mentioned.game.type, mentioned.game.name))
        messageArray.push(`-> Status: **${mentioned.status.toUpperCase()}**`)
        messageArray.push(`-> Bot: **${msg.mentions[0].bot ? 'Yes' : 'No'}**`)
      } else if (msg.mentions.length > 1) {
        messageArray.push('You can only mention 1 person!')
      } else {
        messageArray.push(`-> Name: **${msg.author.username}**`)
        if (msg.member.nick !== null) messageArray.push(`-> Nick: **${msg.member.nick}**`)
        messageArray.push(`-> Id: **${msg.author.id}**`)
        messageArray.push(`-> Discrim: **${msg.author.discriminator}**`)
        messageArray.push(`-> Created At: **${new Date(msg.author.createdAt)}**`)
        if (msg.channel.guild) {
          messageArray.push('-> Joined Server At: **' + new Date(msg.member.joinedAt) + '**')
          messageArray.push('-> Roles: **' + parseRoles() + '**')
        }
        if (msg.member.game !== null) messageArray.push('-> ' + checkGame(msg.member.game.type, msg.member.game.name))
        messageArray.push(`-> Status: **${msg.member.status.toUpperCase()}**`)
        messageArray.push(`-> Bot: **${msg.author.bot ? 'Yes' : 'No'}**`)
      }
      bot.getOAuthApplication('@me').then((own) => {
        if (messageArray.length > 3) {
          if (own.owner.id === userid || userid === bot.user.id) {
            messageArray.push('-> Bot Owner: **Yes**')
            messageArray.push(`-> 2FA: **${bot.user.mfaEnabled ? 'Yes' : 'No'}**`)
            messageArray.push(`-> Verified: **${bot.user.verified ? 'Yes' : 'No'}**`)
          } else {
            if (masterUser.indexOf(userid) >= 0) {
              messageArray.push('-> Bot Owner: **No, but is masteruser.**')
            } else {
              messageArray.push('-> Bot Owner: **No**')
            }
          }
          messageArray.push(getAvy(type))
          bot.createMessage(msg.channel.id, messageArray.join('\n'))
        }
      }).catch(() => {
        bot.createMessage(msg.channel.id, messageArray.join('\n'))
      })
    }
  },
  youtube: {
    name: 'Youtube',
    help: 'If you want to search videos quickly via Discord, use this command!',
    usage: '<youtube <search query>>',
    guildOnly: false,
    lvl: 0,
    fn: function (bot, msg, suffix) {
      YouTube.search(suffix, 4, function(error, result) {
        if (error) {
          console.log(error)
        } else {
          var rand = Math.floor(Math.random() * (3 - 0 + 0)) + 0
          if (result.items[rand] === undefined) {
            try {
              return bot.createMessage(msg.channel.id, 'Something went wrong searching the query!')
            } catch (e) {
              
            }
          }
          bot.createMessage(msg.channel.id, 'https://www.youtube.com/watch?v=' + result.items[rand].id.videoId)
        }
      })
    }
  },
  info: {
    name: 'Info',
    help: 'Tells you about me!',
    usage: '<info>',
    guildOnly: false,
    lvl: 0,
    fn: function (bot, msg, suffix) {
      var gc = []
      bot.guilds.forEach((guild) => {
        gc.push(guild.name)
      })
      var uc = []
      bot.users.forEach((user) => {
        uc.push(user.id)
      })
      var msgArray = []
      msgArray.push(`Hi! I am **${bot.user.username}**! I'm currently in **${gc.length}** servers, serving **${uc.length}** users!`)
      msgArray.push('You can find my source code at https://github.com/TeamCernodile/Freezy, feel free to contribute!')
      msgArray.push('**Freezy** is made by, and regulary updated by Team Cernodile.')
      msgArray.push('Currently running version **' + pkg.version + '**.')
      bot.createMessage(msg.channel.id, msgArray.join('\n'))
    }
  },
  invite: {
    name: 'Invite',
    help: 'Gives you my invite, or lets you indentify invites!',
    usage: '<invite <discord\.gg\/invite>>',
    guildOnly: false,
    lvl: 0,
    fn: function (bot, msg, suffix) {
      var matches = new RegExp(/discord\.gg\/([A-Z0-9-]+)/ig).exec(suffix)
      if (matches !== null) {
        bot.getInvite(matches[1]).then((invData) => {
          var invArray = []
          invArray.push('**Invite detected!**\n')
          invArray.push('**Invite Code:** ' + invData.code)
          invArray.push('**Targets to:** ' + invData.guild.name + ' @ ' + invData.channel.name)
          if (invData.maxAge !== null) {
            invArray.push('**Creation Date:** ' + new Date(invData.createdAt).toLocaleString())
            invArray.push('**Owner of Invite:** ' + invData.inviter.username + '#' + invData.inviter.discriminator + ' *(ID: ' + invData.inviter.id + ')*')
            if (invData.revoked) invArray.push('**Revoked:** Yes')
              if (!invData.revoked) {
                invArray.push('**Revoked:** No')
                var days = ''
                if (Math.abs(invData.maxAge / 60 / 60 / 24) > 0) days = Math.abs(invData.maxAge / 60 / 60 / 24) + ' day(s), ' 
                if (invData.maxAge !== 0) invArray.push('**Length:** ' + days + Math.abs(invData.maxAge / 60 / 60 % 24) + ' hours, ' + Math.abs(invData.maxAge / 60 % 60) + ' minutes')
                if (invData.maxAge === 0) invArray.push('**Length:** Permanent')
              }
              if (invData.maxUses === 0) invArray.push('**Uses:** ' + invData.uses + ' / ∞')
              if (invData.maxUses >= 1) invArray.push('**Uses:** ' + invData.uses + ' / ' + invData.maxUses)
          } else {
            invArray.push("I can't show more properties of invite, unless I have Manage Server/Channel permission on the specified server!")
          }
          bot.createMessage(msg.channel.id, invArray.join('\n'))
        }).catch((e) => {
          console.log(e)
          bot.createMessage(msg.channel.id, '**Sorry!** Unexpected error!')
        })
      } else {
        var invite = []
        var authlink = ''
        invite.push('Hey!\n')
        bot.getOAuthApplication().then((data) => {
          authlink = ' https://discordapp.com/oauth2/authorize?client_id=' + data.id + '&scope=bot'
        }).catch(() => {
          authlink = ' (user accounts do not have, their owner must join servers manually!)'
        })
        setTimeout(() => {
          invite.push(`To invite me to your server, go ahead, and use my OAuth link${authlink}.`)
          invite.push('(If that did not work, then the bot is most likely set on private)')
          invite.push('If you want to know metadata of invites, use the same command')
          invite.push('with a discord.gg invite following it!')
          bot.createMessage(msg.channel.id, invite.join('\n'))
        }, 200)
      }
    }
  },
  server: {
    name: 'Server',
    help: 'Tells you about the server you are in!',
    usage: '<server>',
    guildOnly: true,
    lvl: 0,
    fn: function (bot, msg, suffix) {
      function verifyStages (lvl) {
        if (lvl === 0) return 'None'
        if (lvl === 1) return 'Low'
        if (lvl === 2) return 'Medium'
        if (lvl === 3) return '(╯°□°）╯︵ ┻━┻'
      }
      function countChannels (type) {
        var w = []
        msg.channel.guild.channels.forEach((g) => {
          if (g.type === type) w.push('#' + g.name)
        })
        return w.length
      }
      var msgArray = []
      var guild = msg.channel.guild
      var gName = guild.name
      if (guild.emojis.length >= 1) {
        for (var i in guild.emojis) {
          if (guild.emojis[i].name === 'TCfreezy') {
            gName = '<:TCfreezy:' + guild.emojis[i].id + '>' + guild.name
          }
        }
      }
      var owner = msg.channel.guild.members.get(guild.ownerID).user
      msgArray.push('==< Information for **' + gName + '** >==\n')
      msgArray.push('**-> Region:** ' + guild.region.firstUpperCase())
      msgArray.push('**-> ID:** ' + guild.id)
      msgArray.push('**-> Owner:** ' + owner.username + '#' + owner.discriminator + ' *(ID: ' + owner.id + ')*')
      msgArray.push('**-> Members:** ' + guild.memberCount)
      msgArray.push('**-> Created at:** ' + new Date(guild.createdAt))
      msgArray.push('**-> Text Channels:** ' + countChannels(0))
      msgArray.push('**-> Voice Channels:** ' + countChannels(2))
      if (suffix.toLowerCase() === 'full' || suffix.toLowerCase() === 'all' || suffix.toLowerCase() === 'extend') {
        msgArray.push('**-> Default channel:** <#' + guild.defaultChannel.id + '>')
        var k = []
        console.log(guild.emojis)
        if (guild.emojis.length >= 1) {
          for (var i in guild.emojis) {
            k.push('<:' + guild.emojis[i].name + ':' + guild.emojis[i].id + '>')
          }
          msgArray.push('**-> Custom Emojis:** ' + k.join(' '))
        }
        msgArray.push('**-> Bot Joined At:** ' + new Date(guild.joinedAt))
        msgArray.push('**-> AFK Timeout:** ' + Math.floor(guild.afkTimeout / 60) + ' minutes')
        msgArray.push(`**-> Default Notification:** ${guild.defaultNotifications ? 'Only @\u200Bmentions' : 'All messages'}`)
        msgArray.push('**-> Verification Stage:** ' + verifyStages(guild.verificationLevel))
        msgArray.push(`**-> Server-wide 2FA:** ${guild.mfaLevel ? 'Enabled' : 'Disabled'}`)
      }
      if (guild.afkChannelID !== null) msgArray.push('**-> AFK Channel:** ' + bot.getChannel(guild.afkChannelID).name)
      msgArray.push('**-> Icon:** ' + guild.iconURL)
      bot.createMessage(msg.channel.id, msgArray.join('\n'))
    }
  }
}
function getCommandsName () { // DIRTY
  var cmdArray = []
  var helpArray = []
  helpArray.push('**Commands list**')
  for (var cmd in exports.execute) {
    cmdArray.push(exports.execute[cmd].name.toLowerCase() + ' - ' + exports.execute[cmd].help)
  }
  helpArray.push(cmdArray.sort().join('\n'))
  helpArray.push("If you'd like to know more about a specific command, please type in `" + prefix + "help commands name`!")
  return helpArray.join('\n\n')
}
function getCommandsHelp (command) { // DIRTY
  var cmdArray = []
  for (var cmd in exports.execute) {
    if (exports.execute[cmd].name.toLowerCase() === command.toLowerCase()) {
      cmdArray.push(`**${exports.execute[cmd].name}**\n`)
      cmdArray.push(`**Required level:** ${exports.execute[cmd].lvl}`)
      cmdArray.push(`**Usage:** ${'`' + exports.execute[cmd].usage + '`'}`)
      cmdArray.push(`**Can use in DM:** ${exports.execute[cmd].guildOnly.firstUpperCase()}`)
      cmdArray.push(`**Description:** ${exports.execute[cmd].help}`)
    }
  }
  if (cmdArray.length <= 0) {
    return 'No such command!'
  }
  return cmdArray.join('\n')
}
