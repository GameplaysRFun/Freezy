module.exports = {
  "eval": {
    level: 10,
    desc: "Evaluate code",
    fn: function (bot, msg, suffix, db) {
      function censor(censor) { // eslint-disable-line
        var i = 0;
        return function(key, value) {
          if(i !== 0 && typeof(censor) === 'object' && typeof(value) === 'object' && censor === value && !Array.isArray(value)) return '[Object]';
          if (i > 0 && typeof(value) === 'object' && censor !== value && !Array.isArray(value)) return '[Object]';
          ++i;
          return value;
        };
      }
      try {
        var result = eval(suffix); // eslint-disable-line
        if (typeof result === 'object') {
          result = JSON.stringify(result, censor(result), 4);
          if (JSON.parse(result).shard) {
            result = JSON.parse(result);
            result.shard = '[Too Large To Display]';
            result = JSON.stringify(result, null, 4);
          }
        }
        if (typeof result === 'string') result = result.replace(new RegExp(bot.token, 'gi'), '[Censored]').substr(0, 1990);
        msg.channel.sendMessage('**Evaluation result**\n```xl\n' + result + '\n```').catch(e => {});
      } catch (e) {
        msg.channel.sendMessage(':eyes: Uh oh, there was an error in your code.```xl\n' + e.stack + '\n```').catch(e => {});
      }
    }
  }
};
