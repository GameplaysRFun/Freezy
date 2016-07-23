const Datastore = require('nedb')
const config = require('./config.json')
const chalk = require('chalk')
var info = chalk.bold.green('Info: ')
var masterUser = config.perms.masterUsers
var serverDB = new Datastore({ filename: './datastorage/servers', autoload: true })

function removeUserLvl (server, user) {
  serverDB.update({serverId: server}, {$pull: {lvl1: user}}, {}, function () {})
  serverDB.update({serverId: server}, {$pull: {lvl2: user}}, {}, function () {})
  serverDB.update({serverId: server}, {$pull: {lvl3: user}}, {}, function () {})
}

exports.guildCreation = function (server, user) {
  console.log(info + 'Joined a guild, creating database entry!')
  return new Promise((resolve, reject) => {
    if (!server || !user) return reject('Abort! Missing one or two of the params')
    var serverData = {}
    serverData.serverId = server
    serverData.owner = user
    serverData.lvl1 = []
    serverData.lvl2 = []
    serverData.lvl3 = []
    serverDB.insert(serverData, function (err) {
      if (err) {
        console.log(err.stack) 
        return reject(err)
      } else {
        return resolve(true)
      }
    })
  })
}

exports.guildDeletion = function (server) {
  console.log(info + 'Left a guild, deleting database entry!')
  return new Promise((resolve, reject) => {
    if (!server) return reject('Abort! Missing server!')
    serverDB.remove({serverId: server}, { multi: true }, function (e, doc) {
      if (e) return reject(e)
      if (doc) return resolve(true)
    })
  })
}
exports.changeLvl = function (server, user, level) {
  return new Promise((resolve, reject) => {
    if (!server || !user || !level || level >= 4) return reject('Abort! Either missing some parameters, or invalid parameters!')
    if (level == 1) {
      removeUserLvl(server, user)
      serverDB.update({serverId: server}, {$push: {lvl1: user}}, {}, function () {
        return resolve(true)
      })
    } if (level == 2) {
      removeUserLvl(server, user)
      serverDB.update({serverId: server}, {$push: {lvl2: user}}, {}, function () {
        return resolve(true)
      })
    } if (level == 3) {
      removeUserLvl(server, user)
      serverDB.update({serverId: server}, {$push: {lvl3: user}}, {}, function () {
        return resolve(true)
      })
    }
  })
}

exports.checkIfLvl = function (server, user, level) {
  return new Promise((resolve, reject) => {
    if (!server || !user || !level) return reject('Abort! Missing some parameters!')
    serverDB.findOne({serverId: server}, function (e, doc) {
      if (e) return reject(e)
      if (masterUser.indexOf(user) >= 0) return resolve(9)
      if (doc.owner === user) return resolve(4)
      if (doc.lvl3.indexOf(user) >= 0) return resolve(3)
      if (doc.lvl2.indexOf(user) >= 0) return resolve(2)
      if (doc.lvl1.indexOf(user) >= 0) return resolve(1)
      return resolve(0)
    })
  })
}

exports.checkIfOwner = function (server, user) {
  return new Promise((resolve, reject) => {
    if (!server || !user) return reject('Abort! Missing one or two of the params')
    serverDB.findOne({serverId: server}, function (e, doc) {
      if (e) return reject(e)
      if (doc.owner === user || masterUser.indexOf(user) >= 0) return resolve(true)
    })
  })
}