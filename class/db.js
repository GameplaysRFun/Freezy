const Datastore = require('nedb')
const config = require('../config.json')
const Logger = require('./logger.js')
const path = require("path");
var masterUser = config.perms.masterUsers
var serverDB = new Datastore({ filename: path.join(__dirname, "../", "datastorage", "servers"), autoload: true })
var userDB = new Datastore({ filename: path.join(__dirname, "../", "datastorage", "users"), autoload: true })
/*
*
* Server Database
*
*/
function removeUserLvl (server, user) {
  serverDB.update({serverId: server}, {$pull: {lvl1: user}}, {}, function () {})
  serverDB.update({serverId: server}, {$pull: {lvl2: user}}, {}, function () {})
  serverDB.update({serverId: server}, {$pull: {lvl3: user}}, {}, function () {})
}

exports.guildCreation = function (server, user) {
  Logger.log('Joined a guild, creating database entry!')
  return new Promise((resolve, reject) => {
    if (!server || !user) return reject('Abort! Missing one or two of the params')
    var serverData = {}
    serverData.serverId = server
    serverData.owner = user
    serverData.lvl1 = []
    serverData.lvl2 = []
    serverData.lvl3 = []
    serverData.welcoming = false
    serverData.welcome_message = 'Welcome ${user} to **${guild}**!'
    serverData.farewell_message = 'Farewell, ${user}!'
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
exports.setCustomization = function(server, type, value) {
  return new Promise((resolve, reject) => {
    var types = ['welcoming', 'welcome_message', 'farewell_message']
    if (type === 'welcoming') {
      serverDB.update({serverId: server}, {$set: {welcoming: value}}, {}, function () {
        return resolve(true)
      })
    } if (type === 'welcome_message') {
      serverDB.update({serverId: server}, {$set: {welcome_message: value.replace('welcome_message ', '')}}, {}, function () {
        return resolve(true)
      })
    } if (type === 'farewell_message') {
      serverDB.update({serverId: server}, {$set: {farewell_message: value.replace('farewell_message ', '')}}, {}, function () {
        return resolve(true)
      })
    } if (types.indexOf(type) <= -1) {
      reject('Invalid type')
    }
  })
}
exports.checkCustomization = function(server, type) {
  return new Promise((resolve, reject) => {
    var types = ['welcoming', 'welcome_message', 'farewell_message']
    if (type === 'welcoming') {
      serverDB.findOne({serverId: server}, function (e, doc) {
        if (!doc) return reject('faulty db')
        if (doc.welcoming === true) return resolve(true)
        else return reject()
      })
    } if (type === 'welcome_message') {
      serverDB.findOne({serverId: server}, function (e, doc) {
        if (!doc) return reject('faulty db')
        if (doc.welcome_message) return resolve(doc.welcome_message)
        else return reject()
      })
    } if (type === 'farewell_message') {
      serverDB.findOne({serverId: server}, function (e, doc) {
        if (!doc) return reject('faulty db')
        if (doc.welcome_message) return resolve(doc.farewell_message)
        else return reject()
      })
    } if (types.indexOf(type) <= -1) {
      reject('Invalid type')
    }
  })
}
exports.guildDeletion = function (server) {
  Logger.log('Left a guild, deleting database entry!')
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
      if (!doc) return reject(e)
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
      if (!doc) return reject(e)
      if (doc.owner === user || masterUser.indexOf(user) >= 0) return resolve(true)
    })
  })
}

/*
*
* USER DATABASE
*
*/
exports.createUser = function (user) {
  return new Promise((resolve, reject) => {
    userDB.findOne({userId: user}, function (e, doc) {
      if (!doc) {
        var userData = {}
        userData.userId = user
        userData.achievements = ['generated']
        userDB.insert(userData, function (err) {
          if (err) {
            console.log(err.stack) 
            return reject(err)
          } else {
            return resolve(true)
          }
        })
      }
    })
  })
}
exports.setAchievement = function (user, id) {
  return new Promise((resolve, reject) => {
      exports.checkAchievement(user, id).catch(() => {
        userDB.update({userId: user}, {$push: {achievements: id}}, {}, (e) => {
          if (e) return reject(e)
          resolve('Pushed')
        })
      }).then(() => {
        userDB.update({userId: user}, {$pull: {achievements: id}}, {}, (e) => {
          if (e) return reject(e)
          resolve('Pulled')
        })
      })
  })
}
exports.checkAchievement = function (user, id) {
  return new Promise((resolve, reject) => {
    userDB.findOne({userId: user}, function (e, doc) {
      if (!doc) return reject(exports.createUser(user))
      if (doc.achievements.indexOf(id) >= 0) return resolve(true)
      if (doc.achievements.indexOf(id) < 0) return reject()
    })
  })
}
