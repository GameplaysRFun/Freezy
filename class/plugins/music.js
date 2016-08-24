"use strict"
const request = require('request')
const db = require('../db.js')
const ytdl = require('ytdl-core')
const config = require('../../config.json')
exports.info = {
  'name': 'Music commands',
  'description': 'All music related commands.',
  'owner': 'Cernodile#8057'
}

exports.exec = {
  voice: {
    name: 'Voice',
    help: 'Connects me to a voice channel.',
    usage: '<voice youtube_link>',
    guildOnly: true,
    lvl: 1,
    fn: function (bot, msg) {
      if (msg.member.voiceState.channelID === null) {
        bot.createMessage(msg.channel.id, "\u200B**Can't join a voice channel, if you're not in one yourself!**")
      } else if (msg.member.voiceState.selfDeaf|| msg.member.voiceState.deaf) {
        bot.createMessage(msg.channel.id, "\u200B**Sorry, you're either deafened locally or by server, try again when you're not deafened!**")
      } else {
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
        if (msg.channel.guild.id.indexOf(vc.id) >= 0) {
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
        if (msg.channel.guild.id.indexOf(vc.id) >= 0) {
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
        if (msg.channel.guild.id.indexOf(vc.id) >= 0) {
          if (vc.queue === undefined) vc.queue = []
          if (vc.playing) {
            if (suffix.includes('youtube.com/watch?v=') || suffix.includes('youtu.be/')) {
            ytdl.getInfo(suffix, (e, info) => {
              if (e) return bot.createMessage(msg.channel.id, 'Unable to queue this song!')
              var min = Math.floor(info.length_seconds / 60)
              var sec = Math.floor(info.length_seconds % 60)
              if (min < 10) min = '0' + min
              if (sec < 10) sec = '0' + sec
              let parsedTime = min + ':' + sec
              if (info.title.length > 34 && info.title.lastIndexOf(info.title) !== info.title.length) info.title = info.title.substr(0, 35) + '...'
              vc.queue.push([suffix, info.title, parsedTime, msg.author.id])
              bot.createMessage(msg.channel.id, 'Requested and enqueued **' + info.title+ '** in position **#' + vc.queue.length + '**')
            })
            } else {
              if (suffix.startsWith('http://soundcloud.com') || suffix.startsWith('https://soundcloud.com')) {
                request.get('http://api.soundcloud.com/resolve.json?url=' + suffix + '&client_id=' + config.keys.soundcloudCID, (e, req, body) => {
                  var data = JSON.parse(body)
                  var min = Math.floor(data.duration / 60000 % 60)
                  var sec = Math.floor(data.duration / 1000 % 60)
                  if (min < 10) min = '0' + min
                  if (sec < 10) sec = '0' + sec
                  let parsedTime = min + ':' + sec
                  if (data.title.length >= 35 && data.title.lastIndexOf(data.title) !== data.title.length) data.title = data.title.substr(0, 35) + '...'
                  vc.queue.push([data["stream_url"] + '?client_id=' + config.keys.soundcloudCID, data.title, parsedTime, msg.author.id])
                  bot.createMessage(msg.channel.id, 'Requested and enqueued **' + data.title + '** in position **#' + vc.queue.length + '**')
                })
              } else {
                var title = suffix.match(/\/([a-z0-9%]+)\.mp3/ig)
                vc.queue.push([suffix, title[0], '??:??', msg.author.id])
                bot.createMessage(msg.channel.id, 'Requested and enqueued unknown song in position **#' + vc.queue.length + '**')
              }
            }
          } else {
            function play (link) {
              if (link.includes('youtube') || link.includes('youtu.be')) {vc.playStream(ytdl(link), {inlineVolume: true})}
              if (link.includes('soundcloud.com')) {
                if (vc.queue.length === 0) {
                  request.get('http://api.soundcloud.com/resolve.json?url=' + link + '&client_id=' + config.keys.soundcloudCID, (e, req, body) => {
                    let data = JSON.parse(body)
                    vc.playStream(request.get(data["stream_url"] + '?client_id=' + config.keys.soundcloudCID), {inlineVolume: true})
                    var min = Math.floor(data.duration / 60000 % 60)
                    var sec = Math.floor(data.duration / 1000 % 60)
                    if (min < 10) min = '0' + min
                    if (sec < 10) sec = '0' + sec
                    var songName = data.title
                    if (songName.length >= 35) songName = data.title.substr(0, 35) + '...'
                    bot.createMessage(msg.channel.id, '`[' + min + ':' + sec + ']` Now playing **' + songName + '** requested by ' + msg.author.username + '#' + msg.author.discriminator + ' (' + msg.author.id + ')...')
                  })
                } else {
                  vc.playStream(request.get(link), {inlineVolume: true})
                }
              }
              if (!link.includes('youtube') && !link.includes('youtu.be') && !link.includes('soundcloud.com')) {
                vc.playStream(request.get(link))
                bot.createMessage(msg.channel.id, '`[??:??`] Now playing **' + suffix.match(/\/([a-z0-9%]+)\.mp3/ig)[0] + '** requested by ' + msg.author.username + '#' + msg.author.discriminator + ' (' + msg.author.id + ')...')
              }
              if (vc.queue.length === 0) {
                if (link.includes('youtube.com') || link.includes('youtu.be')) {
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
                }
              } else {
                var next = ''
                function getName (pos) {
                  if (!pos) pos = 0
                  return msg.channel.guild.members.get(vc.queue[pos][3]).user.username + '#' + msg.channel.guild.members.get(vc.queue[pos][3]).user.discriminator + ' (' + msg.channel.guild.members.get(vc.queue[pos][3]).user.id + ')'
                }
                if (vc.queue.length > 1) next = '\nUp next in the queue is **' + vc.queue[1][1] + '**...'
                bot.createMessage(msg.channel.id, '`[' + vc.queue[0][2] + ']` Now playing **' + vc.queue[0][1] + '** requested by ' + getName(0) + '...' + next)
              }
              vc.once('end', () => {
                if (!vc.playing) {
                  if (vc.queue.length > 0) {
                    play(vc.queue[0][0])
                    return vc.queue.shift()
                  } else {
                    vc.disconnect()
                    return bot.createMessage(msg.channel.id, 'All songs in the queue have been played, leaving voice channel!')
                  }
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
  skip: {
    name: 'Skip',
    help: 'Skips current song.',
    usage: '<skip>',
    guildOnly: true,
    lvl: 0,
    fn: function (bot, msg) {
      bot.voiceConnections.forEach((vc) => {
        if (msg.channel.guild.id.indexOf(vc.id) >= 0) {
          var lvl = 0
          db.checkIfLvl(msg.channel.guild.id, msg.author.id).then((kk) => {
            lvl = kk
          })
          if (lvl >= 1 && vc.queue[0] !== undefined || vc.queue[0][3] === msg.author.id && vc.queue[0] !== undefined) {
            bot.createMessage(msg.channel.id, ':watch: **Skipped current song**')
            vc.stopPlaying()
          } else {
            bot.createMessage(msg.channel.id, ':x: **Permission Denied!**\nYou need either level 1 permission, or be the song requester to skip current song!')
          }
        }
      })
    }
  }
}
