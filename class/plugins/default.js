"use strict"
const Logger = require('../logger.js')
const db = require('../db.js')
const config = require('../../config.json')
const pkg = require('../../package.json')
let prefix = config.config.prefix
let masterUser = config.perms.masterUser

exports.info = {
  'name': 'Default commands',
  'description': 'Commands used for regular actions.',
  'owner': 'Cernodile#8057'
}

String.prototype.replaceAll = function (target, replacement) {
  return this.split(target).join(replacement)
}
String.prototype.firstUpperCase = function () {
  return this.charAt(0).toUpperCase() + this.substring(1);
}

exports.exec = {
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
  purge: {
    name: 'Purge',
    help: 'Purges messages in channel.',
    usage: '<purge amount>',
    guildOnly: true,
    lvl: 0,
    fn: function (bot, msg, suffix) {
      if (msg.member.permission.json['manageMessages']) {
        if (parseInt(suffix) <= 100 && parseInt(suffix) > 0) {
          bot.getMessages(msg.channel.id, parseInt(suffix)).then((deletThis) => {
            var finalDelet = []
            deletThis.forEach((delet) => {
              finalDelet.push(delet.id)
            })
            if (parseInt(suffix) !== 1 && deletThis[0] !== undefined && finalDelet.length > 1) {
              bot.deleteMessages(msg.channel.id, finalDelet).then(() => {
                bot.createMessage(msg.channel.id, ':printer: Deleted **' + finalDelet.length + '** messages!')
              }).catch(() => {
                bot.createMessage(msg.channel.id, ':x: I do not have sufficient permissions!\n**ERR_CODE:** manageMessages')
              })
            } else if (deletThis[0] !== undefined && parseInt(suffix) === 1) {
              bot.deleteMessage(msg.channel.id, deletThis[0].id).then(() => {
                bot.createMessage(msg.channel.id, ':printer: Deleted **' + parseInt(suffix) + '** message!')
              }).catch(() => {
                bot.createMessage(msg.channel.id, ':x: I do not have sufficient permissions!\n**ERR_CODE:** manageMessages')
              })
            } else {
              bot.createMessage(msg.channel.id, ':x: No messages to purge!')
            }
          }).catch(() => {
            bot.createMessage(msg.channel.id, ':x: I do not have sufficient permissions!\n**ERR_CODE:** readMessageHistory')
          })
        } else {
          return bot.createMessage(msg.channel.id, ':x: Your number must be between 1 and 100!')
        }
      } else {
        return bot.createMessage(msg.channel.id, ':x: You do not have sufficient permissions!\n**ERR_CODE:** manageMessages')
      }
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
        Logger.suggest(`${msg.author.username}#${msg.author.discriminator} (${msg.author.id}) suggested: ${suffix}`)
      }
    }
  },
  ban: {
    name: 'Ban',
    help: 'This command is meant for server staff to ban people.',
    usage: '<ban @\u200Bmention>',
    guildOnly: true,
    lvl: 0,
      fn: function (bot, msg, suffix) {
        if (msg.channel.guild.members.get(bot.user.id).permission.json['banMembers']) {
          if (msg.member.permission.json['banMembers']) {
            if (msg.mentions.length === 1) {
              if (suffix.startsWith('confirm')) {
                bot.banGuildMember(msg.channel.guild.id, msg.mentions[0].id, 1).then(() => {
                  bot.createMessage(msg.channel.id, '**' + msg.mentions[0].username + '** has been banned! :eyes: :hammer:')
                }).catch(() => {
                  bot.createMessage(msg.channel.id, ':x: Couldn\'t ban **' + msg.mentions[0].username + '**, most likely person\'s role is higher than bot\'s!')
                })
              } else {
                bot.createMessage(msg.channel.id, ':warning: **Confirmation**\nConfirm your action by typing in `' + prefix + 'ban confirm @\u200Bmention`\n**THIS ACTION IS IRREVERSIBLE!**')
              }
            } else {
              bot.createMessage(msg.channel.id, "You didin't mention anyone!")
            }
          } else {
            bot.createMessage(msg.channel.id, 'Your role does not have enough permissions!')
          }
        } else {
          bot.createMessage(msg.channel.id, 'The bot\'s role has no sufficient permissions!')
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
        if (msg.channel.guild.members.get(bot.user.id).permission.json['kickMembers']) {
          if (msg.member.permission.json['kickMembers']) {
            if (msg.mentions.length === 1) {
              if (suffix.startsWith('confirm')) {
                bot.deleteGuildMember(msg.channel.guild.id, msg.mentions[0].id, 1).then(() => {
                  bot.createMessage(msg.channel.id, '**' + msg.mentions[0].username + '** has been kicked! :eyes: :hammer:')
                }).catch(() => {
                  bot.createMessage(msg.channel.id, ':x: Couldn\'t kick **' + msg.mentions[0].username + '**, most likely person\'s role is higher than bot\'s!')
                })
              } else {
                bot.createMessage(msg.channel.id, ':warning: **Confirmation**\nConfirm your action by typing in `' + prefix + 'kick confirm @\u200Bmention`\n**THIS ACTION IS IRREVERSIBLE!**')
              }
            } else {
              bot.createMessage(msg.channel.id, "You didin't mention anyone!")
            }
          } else {
            bot.createMessage(msg.channel.id, 'Your role does not have enough permissions!')
          }
        } else {
          bot.createMessage(msg.channel.id, 'The bot\'s role has no sufficient permissions!')
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
  },
  profile: {
    name: 'Profile',
    help: 'Displays your profile',
    usage: '<profile <set/remove> <field> <value>>',
    guildOnly: false,
    lvl: 0,
    fn: function (bot, msg, suffix) {
      if (!suffix || suffix.length < 2) {
        db.getProfile(msg.author.id).then((profile) => {
          if (profile === 'Created Profile') return bot.createMessage(msg.channel.id, ':white_check_mark: Generated Profile.')
          if (profile !== 'Created Profile') {
            var profileArray = []
            for (var i in profile) {
              profileArray.push(profile[i][0].firstUpperCase() + ': ' + profile[i][1])
            }
            setTimeout(() => {
              if (profileArray.length === 0) {
                profileArray.push('**As you look around, you realise, there is only a empty profile.**')
              }
              return bot.createMessage(msg.channel.id, profileArray.join('\n'))
            }, 500)
          }
        }).catch((e) => {
          return bot.createMessage(msg.channel.id, ':white_check_mark: Generated User for Achievements & Profile')
        })
      } else {
        if (suffix.toLowerCase().startsWith('set')) {
          if (suffix.split(' ')[1] && suffix.split(' ')[2]) {
            db.updateProfile(msg.author.id, suffix.split(' ')[1], suffix.substr(suffix.split(' ')[1].length + 'set'.length + 2)).then((t) => {
              if (t === 'Pushed') return bot.createMessage(msg.channel.id, 'Added field to db.')
              if (t === 'Updated') return bot.createMessage(msg.channel.id, 'Updated field to db.')
            }).catch((e) => {
              bot.createMessage(msg.channel.id, 'Error: ' + e)
            })
          } else {
            bot.createMessage(msg.channel.id, 'Invalid arguments.')
          }
        }
        if (suffix.toLowerCase().startsWith('remove')) {
          if (suffix.split(' ')[1]) {
            db.updateProfile(msg.author.id, suffix.split(' ')[1], true).then((done) => {
              bot.createMessage(msg.channel.id, 'Deleted field.')
            })
          }
        }
        if (msg.mentions.length === 1) {
          db.getProfile(msg.mentions[0].id).then((profile) => {
            if (profile === 'Missing Profile') return bot.createMessage(msg.channel.id, ':x: **Specified user has no profile**.')
            if (profile !== 'Missing Profile') {
              var profileArray = []
              for (var i in profile) {
                profileArray.push(profile[i][0].firstUpperCase() + ': ' + profile[i][1])
              }
              setTimeout(() => {
                if (profileArray.length === 0) {
                  profileArray.push('**As you look around, you realise, there is only a empty profile.**')
                }
                return bot.createMessage(msg.channel.id, profileArray.join('\n'))
              }, 500)
            }
          })
        }
      }
    }
  }
}

function getCommandsName () { // DIRTY
  var cmdArray = []
  var helpArray = []
  helpArray.push('**Commands list**')
  for (var cmd in exports.exec) {
    cmdArray.push(exports.exec[cmd].name.toLowerCase() + ' - ' + exports.exec[cmd].help)
  }
  helpArray.push(cmdArray.sort().join('\n'))
  helpArray.push("If you'd like to know more about a specific command, please type in `" + prefix + "help commands name`!")
  return helpArray.join('\n\n')
}
function getCommandsHelp (command) { // DIRTY
  var cmdArray = []
  for (var cmd in exports.exec) {
    if (exports.exec[cmd].name.toLowerCase() === command.toLowerCase()) {
      cmdArray.push(`**${exports.exec[cmd].name}**\n`)
      cmdArray.push(`**Required level:** ${exports.exec[cmd].lvl}`)
      cmdArray.push(`**Usage:** ${'`' + exports.exec[cmd].usage + '`'}`)
      cmdArray.push(`**Can use in DM:** ${exports.exec[cmd].guildOnly}`)
      cmdArray.push(`**Description:** ${exports.exec[cmd].help}`)
    }
  }
  if (cmdArray.length <= 0) {
    return 'No such command!'
  }
  return cmdArray.join('\n')
}
