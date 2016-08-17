const winston = require('winston')
winston.loggers.add('Logger', {
  console: {
    colorize: true
  },
  transports: [
    new (winston.transports.File) (
      {
        filename: './logs/normal',
        level: 'info',
        json: false,
        formatter: function (options) {
          return '[' + new Date(Date.now()).toLocaleString() + '] ' + options.message
        }
      }
    ),
    new (winston.transports.File) (
      {
        filename: './logs/errors',
        level: 'error',
        json: false,
        formatter: function (options) {
          return '[' + new Date(Date.now()).toLocaleString() + '] ' + options.message
        }
      }
    )
  ]
})
winston.loggers.add('Suggest', {
  transports: [
    new (winston.transports.File) (
        {
            filename: './logs/suggestions',
            level: 'info',
            json: false,
            formatter: function (options) {
                return '[' + new Date(Date.now()).toLocaleString() + '] ' + options.message
            }
        }
    )  
  ]
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
exports.post = function (msg) {
    Logger.info('HTTP: ' + msg)
}
exports.suggest = function (msg) {
   winston.loggers.get('Suggest').info(msg)
}
