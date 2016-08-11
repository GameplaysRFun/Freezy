const winston = require('winston')
winston.loggers.add('Logger', {
  console: {
    colorize: true
  }
})
var Logger = winston.loggers.get('Logger')
exports.log = function (msg) {
    Logger.info(msg)
}
exports.warn = function (msg) {
    Logger.warn(msg)
}
exports.error = function (msg) {
    Logger.error(msg)
}
