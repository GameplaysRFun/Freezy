var unirest = require("unirest");
var config = require("../config.json");
module.exports = {
  "fortune": {
    desc: "Encounter a random fortune cookie message.",
    level: 0,
    fn: function(bot, msg, suffix) {
      unirest.get(`https://thibaultcha-fortunecow-v1.p.mashape.com/random`).header("X-Mashape-Key", config.api.mashape).header("Accept", "text/plain").end(function (result) {
        msg.channel.sendMessage('```' + result.body + '```');
      });
    }
  },
  "pwned": {
    desc: "Have you been pwned? Find out about any possible breaches.",
    level: 0,
    fn: function (bot, msg, suffix) {
      unirest.get("https://troyhunt-have-i-been-pwned.p.mashape.com/v2/breachedaccount/" + (suffix ? encodeURIComponent(suffix) : encodeURIComponent(msg.author.username))).header("X-Mashape-Key", config.api.mashape).header("User-Agent", "DiscordBot Freezy").header("Accept", "application/json").end(function (result) {
        if (result.status === 200) {
          var m = [];
          for (var i in result.body) {
            if (i == 4) {
              m.push("**Showcasing 3 results out of " + result.body.length + ".**");
            } else if (i < 4) {
              var obj = result.body[i];
              var desc = obj.Description.replace(new RegExp("&quot;", "g"), "\"").replace(new RegExp("<a href=\"", "g"), "<").replace(new RegExp("</a>", "g"), "").replace(new RegExp('" target="_blank" rel="noopener">', "g"), "> - ").substr(0, 400);
              if (desc.length === 400) desc += "...";
              m.push("**Title:** " + obj.Title);
              m.push("**Affected domain:** " + obj.Domain);
              m.push("**Breached At:** " + new Date(obj.BreachDate).toUTCString());
              m.push("**People affected:** " + obj.PwnCount);
              m.push("**Added to Database:** " + new Date(obj.AddedDate).toUTCString());
              m.push("**Sensitive Information:** " + (obj.isSensitive ? "Yes" : "No"));
              m.push("**Breached Information:** " + obj.DataClasses.join(', '));
              m.push("**Description:** " + desc);
              m.push("");
            }
          }
          var send = m.join('\n').substr(0, 1997);
          if (send.length === 1997) send += "...";
          msg.channel.sendMessage(send).catch(e => {});
        } else {
          msg.channel.sendMessage("**Either the API is down or no were breaches found**").catch(e => {});
        }
      });
    }
  },
  "love": {
    desc: "Ever wanted to see if you would have a chance with your crush? Find out with this fun command!",
    level: 0,
    fn: function (bot, msg, suffix) {
      var args = [];
      if (suffix.includes("|")) {
        args = suffix.split(" | ");
      } else args = suffix.split(" ");
      if (args.length < 2) {
        msg.channel.sendMessage("Too few arguments.").catch(e => {});
      }
      unirest.get("https://love-calculator.p.mashape.com/getPercentage?fname=" + encodeURIComponent(args[0]) + "&sname=" + encodeURIComponent(args[1])).header("X-Mashape-Key", config.api.mashape).header("Accept", "application/json").end(function (result) {
        if (result.status === 200) {
          var data = result.body;
          var m = [
            {
              name: "Person 1",
              value: args[0],
              inline: true
            },
            {
              name: "Person 2",
              value: args[1],
              inline: true
            },
            {
              name: "The odds",
              value: data.percentage + "%",
              inline: true
            }
          ];
          var embed = {
            color: 0x228dc8,
            author: {
              name: bot.user.username,
              icon_url: bot.user.displayAvatarURL.replace('.jpg', '.png')
            },
            thumbnail: {
              url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Twemoji_2665.svg/768px-Twemoji_2665.svg.png"
            },
            fields: m,
            footer: {
              text: "This message was user executed",
              icon_url: msg.author.displayAvatarURL.replace('.jpg', '.png')
            },
            timestamp: new Date(Date.now()).toISOString()
          };
          msg.channel.sendEmbed(embed).catch(e => {});
        }
      });
    }
  },
  "leet": {
    desc: "unl345h y0ur 1nn3r 5cr1p7 k1dd13",
    level: 0,
    fn: function (bot, msg, suffix) {
      if (!suffix) {
        msg.channel.sendMessage("**I can't encode nothing!** Please try again with some text.");
      } else {
        var parsed = suffix.replace(/[a-z]/g,function f(a){return"4BCD3F6H1JKLMN0PQR57"[parseInt(a, 36)-10]||a.replace(/[a-t]/gi,f);});
        msg.channel.sendMessage(parsed.toLowerCase()).catch(e => {});
      }
    }
  }
};
