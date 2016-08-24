const db = require('../db.js')
const config = require('../../config.json')

exports.info = {
  'name': 'Tag Logic',
  'description': 'All tag related commands.',
  'owner': 'Cernodile#8057'
}
exports.exec = {
  tag: {
    name: 'Tag',
    help: 'Tagssss',
    usage: '<tag <create/tag name>>',
    lvl: 0,
    guildOnly: false,
    fn: function (bot, msg, suffix) {
      if (suffix.split(' ')[0].toLowerCase() === 'create') {
        if (suffix.split(' ')[1] !== undefined && suffix.split(' ')[1].length <= 80) {
          db.createTag(msg.author.id, suffix.split(' ')[1], suffix.substr(suffix.split(' ')[1].length + suffix.split(' ')[0].length + 2)).then((result) => {
            bot.createMessage(msg.channel.id, '**Tag successfuly created!**')
          }).catch(() => {
            bot.createMessage(msg.channel.id, '**Tag already exist!**')
          })
        }
      } else if (suffix.split(' ')[0].toLowerCase() === 'edit') {
          if (suffix.split(' ')[1] !== undefined && suffix.split(' ')[1].length <= 80) {
            db.editTag(msg.author.id, suffix.split(' ')[1], suffix.substr(suffix.split(' ')[1].length + suffix.split(' ')[0].length + 2)).then((result) => {
              bot.createMessage(msg.channel.id, '**Tag successfuly edited!**')
            }).catch(() => {
              bot.createMessage(msg.channel.id, ':x: **Tag either does not exist or you do not own it!**')
            })
          }
      } else {
        if (suffix.split(' ')[0] !== '') {
          db.getTag(suffix.split(' ')[0]).then((tag) => {
            return bot.createMessage(msg.channel.id, tag.content.parseTag(bot, msg))
          }).catch((e) => {
            return bot.createMessage(msg.channel.id, ':x: **The tag `' + suffix.split(' ')[0] + '` does not exist!**')
          })
        } else {
          bot.createMessage(msg.channel.id, '**Please use `' + config.config.prefix + 'help tag` to see available options!**')
        }
      }
    }
  }
}
String.prototype.parseTag = function (bot, msg) {
  if (msg.channel.guild) return this.replaceAll('{user}', msg.author.username).replaceAll('{atuser}', msg.author.mention).replaceAll('{discrim}', msg.author.discriminator).replaceAll('{id}', msg.author.id).replaceAll('{createdAt}', new Date(msg.author.createdAt)).replaceAll('{bot}', msg.author.bot).replaceAll('{defaultAvatar}', msg.author.defaultAvatarURL).replaceAll('{avatar}', msg.author.avatarURL).replaceAll('{guild}', msg.channel.guild.name).replaceAll('{members}', msg.channel.guild.memberCount).replaceAll('{guildID}', msg.channel.guild.id)
  return this.replaceAll('{user}', msg.author.username).replaceAll('{atuser}', msg.author.mention).replaceAll('{discrim}', msg.author.discriminator).replaceAll('{id}', msg.author.id).replaceAll('{createdAt}', new Date(msg.author.createdAt)).replaceAll('{bot}', msg.author.bot).replaceAll('{defaultAvatar}', msg.author.defaultAvatarURL).replaceAll('{avatar}', msg.author.avatarURL)
}
