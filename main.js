var config = require("./config.json");
var Discord = require("discord.js");
const sharder = new Discord.ShardingManager(`./shard.js`, {totalShards: config.Constants.shards, token: config.login.token}, false);
for (var i = config.Constants.startAt; i < config.Constants.endAt; i++) {
  sharder.createShard(i);
}
process.on('exit', () => {
  sharder.broadcastEval("process.exit()");
});
