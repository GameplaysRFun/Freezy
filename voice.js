var config = require("../config.json");
var ytdl = require("youtube-dl");
function keepGoing (vc, obj, channel, bot) {
  var dispatcher = vc.playStream(ytdl(obj.link), {passes: 2, volume: 0.8});
  vc.dispatcher = dispatcher;
  var support = "";
  if (config.links.github) {
    support += "\nSupport " + bot.user.username + "'s development by contributing to the [source code](" + config.links.github + ")";
  }
  if (config.donation.paypal) {
    support += "\nIf that's out of bounds for you, you can donate to my [PayPal](" + config.donation.paypal + ")";
  }
  var embed = {
    color: 0x228dc8,
    author: {
      name: bot.user.username + " Music",
      icon_url: bot.user.displayAvatarURL.replace('.jpg', '.png')
    },
    thumbnail: {
      url: obj.thumbnail
    },
    description: "Now playing **[" + obj.title + "](" + obj.link + ")**\nEstimated length for this song is `" + obj.length.split(":")[0] + " minutes and " + obj.length.split(":")[1] + " seconds`" + support,
    footer: {
      text: "This message was bot executed",
      icon_url: bot.user.displayAvatarURL.replace('.jpg', '.png')
    },
    timestamp: new Date(Date.now()).toISOString()
  };
  channel.sendMessage("", {embed}).then(m => {
    if (vc.lastMsg) {
      channel.fetchMessage(vc.lastMsg).catch(e => {}).then(m => m.delete());
    }
    vc.lastMsg = m.id;
  }).catch(e => {});
  dispatcher.once("end", () => {
    if (vc.queue) {
      vc.queue.shift();
      if (vc.queue.length > 0) {
        keepGoing(vc, vc.queue[0], channel, bot);
      } else {
        vc.disconnect().catch(e => {});
        channel.sendMessage("No song has been requested in time. Disconnecting from voice channel.").catch(e => {});
      }
    } else vc.disconnect().catch(e => {});
  });
}
module.exports = {
  "np": {
    desc: "Now playing song",
    guild: true,
    level: 0,
    fn: function (bot, msg, suffix) {
      if (bot.voiceConnections.has(msg.guild.id)) {
        var vc = bot.voiceConnections.get(msg.guild.id);
        if (vc.queue) {
          var embed = {
            color: 0x228dc8,
            author: {
              name: bot.user.username + " Music",
              icon_url: bot.user.displayAvatarURL.replace('.jpg', '.png')
            },
            thumbnail: {
              url: vc.queue[0].thumbnail
            },
            description: "Currently playing **[" + vc.queue[0].title + "](" + vc.queue[0].link + ")**\nEstimated length for this song is `" + vc.queue[0].length.split(":")[0] + " minutes and " + vc.queue[0].length.split(":")[1] + " seconds`",
            footer: {
            text: "This command was user-executed",
              icon_url: msg.author.displayAvatarURL.replace('.jpg', '.png')
            },
            timestamp: new Date(Date.now()).toISOString()
          };
          msg.channel.sendMessage("", {embed}).catch(e => {});
        } else {
          msg.channel.sendMessage("Currently playing the waiting song.").catch(e => {});
        }
      } else {
        msg.channel.sendMessage("I'm not streaming in this server, sorry!").catch(e => {});
      }
    }
  },
  "voice": {
    desc: "Connects the bot to a voice channel.",
    guild: true,
    level: 0,
    fn: function (bot, msg, suffix) {
      if (bot.voiceConnections.size >= config.Constants.vcPerShard) {
        msg.channel.sendMessage("**Sorry!** All of my streaming slots on this shard are taken, try again later when I'm not as busy!").catch(e => {});
      } else {
        if (msg.member.voiceChannel) {
          if (!bot.voiceConnections.has(msg.guild.id)) {
            msg.member.voiceChannel.join().then(vc => {
              msg.channel.sendMessage("**Joined the voice channel.** You have time until this song ends to request anything.").catch(e => {});
              const dispatcher = vc.playStream(ytdl("https://www.youtube.com/watch?v=xy_NKN75Jhw"), {passes: 2, volume: 0.8})
              vc.dispatcher = dispatcher;
              vc.firstSong = true;
              vc.dispatcher.once("end", () => {
                var vc = bot.voiceConnections.get(msg.guild.id);
                vc.firstSong = false;
                if (vc.queue) {
                  if (vc.queue.length > 0) {
                    keepGoing(vc, vc.queue[0], msg.channel, bot);
                  } else {
                    vc.disconnect().catch(e => {});
                  }
                } else {
                  vc.disconnect().catch(e => {});
                  msg.channel.sendMessage("No song has been requested in time. Disconnecting from voice channel.").catch(e => {});
                }
              });
            }).catch(e => {});
          } else {
            msg.channel.sendMessage("Already streaming.").catch(e => {});
          }
        } else {
          msg.channel.sendMessage("Please check that you're in a voice channel yourself before inviting me.").catch(e => {});
        }
      }
    }
  },
  "skip": {
    desc: "Skips a song",
    guild: true,
    level: 0,
    fn: function (bot, msg, suffix) {
      if (bot.voiceConnections.has(msg.guild.id)) {
        var vc = bot.voiceConnections.get(msg.guild.id);
        vc.dispatcher.end();
      }
    }
  },
  "queue": {
    desc: "Checks the queue",
    guild: true,
    level: 0,
    fn: function (bot, msg, suffix) {
      if (bot.voiceConnections.has(msg.guild.id)) {
        var vc = bot.voiceConnections.get(msg.guild.id);
        var msgArray = [];
        for (var i in vc.queue) {
          if (i < 21) {
            msgArray.push('**' + (parseInt(i) + 1) + '**. ' + vc.queue[i].title);
          } else if (i < 22) {
            msgArray.push("\n*...and more*");
          }
        }
        msg.channel.sendMessage(msgArray.join('\n')).catch(e => {});
      } else msg.channel.sendMessage("**Sorry!** It seems as I'm not streaming in this server.").catch(e => {});
    }
  },
  "request": {
    desc: "Request a song",
    level: 0,
    fn: function (bot, msg, suffix) {
      var support = "";
      if (config.links.github) support += "\nSupport " + bot.user.username + "'s development by contributing to the [source code](" + config.links.github + ")";
      if (config.donation.paypal) support += "\nIf that's out of bounds for you, you can donate to my [PayPal](" + config.donation.paypal + ")";
      if (bot.voiceConnections.has(msg.guild.id)) {
        var vc = bot.voiceConnections.get(msg.guild.id);
        if (suffix) {
          if (suffix.includes("playlist") && suffix.includes("http")) msg.channel.sendMessage("Parsing playlist, this might take a while...").catch(e => {});
          if (!suffix.startsWith("http")) suffix = "ytsearch:" + suffix;
          ytdl.getInfo(suffix, function(e, info) {
            if (e) {
              return msg.channel.sendMessage("Unable to request this song!").catch(e => {});
            }
            if (!vc.queue) {
              vc.queue = [];
            }
            if (Array.isArray(info)) {
              for (var i = 0; i < (config.Constants.songsPerList + 1); i++) {
                if (!info[i] || i == (config.Constants.songsPerList)) {
                  if (vc.firstSong) {
                    vc.dispatcher.end();
                  }
                  return msg.channel.sendMessage("Enqueued " + i + " songs to the playlist!").catch(e => {});
                } else if (vc.queue.length > (config.Constants.songsPerList - 1)) {
                  if (vc.queue.length === config.Constants.songsPerList && i !== 0) {
                    if (vc.firstSong) {
                      vc.dispatcher.end();
                    }
                    return msg.channel.sendMessage("Enqueued " + i + " songs to the playlist!\nThe playlist is now full.").catch(e => {});
                  }
                } else {
                  vc.queue.push({link: info[i].webpage_url, length: info[i].duration, title: info[i].title, thumbnail: info[i].thumbnail});
                }
              }
            } else {
              if (vc.queue.length > (config.Constants.songsPerList - 1)) {
                msg.channel.sendMessage("Playlist is full. Try again later.").catch(e => {});
              }
              vc.queue.push({link: info.webpage_url, length: info.duration, title: info.title, thumbnail: info.thumbnail});
              if (vc.firstSong) {
                vc.dispatcher.end();
              } else {
                msg.channel.sendEmbed({
                  author: {
                    name: bot.user.username + " Music",
                    icon_url: bot.user.displayAvatarURL.replace('.jpg', '.png')
                  },
                  thumbnail: {url: info.thumbnail},
                  footer: {
                    text: "This message was bot executed",
                    icon_url: bot.user.displayAvatarURL.replace('.jpg', '.png')
                   },
                  timestamp: new Date(Date.now()).toISOString(),
                  description: "Placed [**" + info.title + "**](" + info.webpage_url + ") at position #" + vc.queue.length + "\nThis song should last for `" + info.duration.split(":")[0] + " minutes and " + info.duration.split(":")[1] + " seconds.`" + support
                }).catch(e => {});
              }
            }
          });
        } else msg.channel.sendMessage("**Sorry!** It seems as you are not requesting anything!").catch(e => {});
      } else msg.channel.sendMessage("**Sorry!** It seems as I'm not streaming in this server.").catch(e => {});
    }
  }
};
