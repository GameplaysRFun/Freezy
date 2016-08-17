# Freezy
Freezy is a open-source Discord bot made for ease of use, formerly known as Prelix. This is a complete rewrite, under another library called 'Eris' by [abalabahaha](https://github.com/abalabahaha). Feel free to contribute to this project!

NOTE! Freezy uses Eris development build, to get it, type in `npm install abalabahaha/Eris#dev`!

[![Node](https://img.shields.io/badge/Node-5.x.x-green.svg)](http://nodejs.org)
[![NPM](https://img.shields.io/badge/NPM-3.x.x-blue.svg)](http://nodejs.org)
[![License](https://img.shields.io/badge/License-GPL--3.0-blue.svg)]()
[![Version](https://img.shields.io/badge/Version-1.0.4-green.svg)]()
[![Status](https://img.shields.io/badge/Status-Stable-green.svg)]()
## Getting started
First up open the config.json file, it should look something like this;
```json
{
    "login": {
        "token": "your bot token"
    },
    "config": {
        "prefix": ">",
        "shards": 3,
        "stacktrace": false,
        "discordbots": false
    },
    "server": {
        "id": "your bot's server id",
        "contributor": "your contributor role id",
        "staff": "your staff role id",
        "enabled": false
    },
    "perms": {
        "masterUsers": [],
        "lvl3": [],
        "lvl2": [],
        "lvl1": []
    },
    "keys": {
        "ytapi": "youtube v3 api key",
        "cse": "cse key",
        "discordbots": "discord bots API key"
    }
}

```
Change the `"token": "your bot token"` to match your bot's token, which you can obtain at your Discord Developers page, also it's recommended to change the default prefix `>` to prevent dozens of duplicates of same framework.
Once you've done that, you're probably wondering, "Well, then, how do I run it!?", simple enough, you have to get Node first, (click on the Node badge above), then open a command prompt/terminal, enter the directory you dropped the bot files at, and type in `npm install`. Also, don't forget to insert your user id in `"masterUsers": []` like this; `"masterUsers": ["yourUserID", "maybeEvenYourFriendID]`! Once you've done all that, type in `node main`, and it should run flawless! If you have any issues, let us know in our server. The rest is to figure out yourself.

[![Discord](https://discordapp.com/api/guilds/206431108047437824/widget.png?style=banner3)](https://discord.gg/ZKA7sE8)
