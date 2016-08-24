const ytnode = require('youtube-node')
const YouTube = new ytnode()
const config = require('../../config.json')
YouTube.setKey(config.keys.ytapi)
exports.info = {
  'name': 'Fun commands',
  'description': 'Have some fun with these commands!',
  'owner': 'Cernodile#8057'
}

exports.exec = {
  '8ball': {
    name: '8ball',
    help: '',
    usage: '',
    lvl: 0,
    fn: function (bot, msg, suffix) {
      bot.createMessage(msg.channel.id, 'Plugin test.')
    },
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
}
