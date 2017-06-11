"use strict";
const config = require("../config");
const utils = require("../src/utils");

let fun = {
  pattern: /!hug|!fight/i,
  execute: function (bot, channelID, userTag, userID, command, msg) {
    switch (command.toLowerCase()) {
      case "!hug":
        if (!msg.mentions[0]) {
          utils.botReply(bot, userID, channelID, "you forgot to choose who to give the hug to!", command, msg.id, false);
          return;
        }

        if (msg.mentions.length > 1) {
          utils.botReply(bot, userID, channelID, "we love that you're trying to spread the love around, but only one-on-one hugs for right now!", command, msg.id, false);
          return;
        }

        bot.createMessage(channelID, "<@" + msg.mentions[0].id + ">, " + msg.author.username + " just gave you a big big hug!");
        break;
      case "!fight":
        if (!msg.mentions[0]) {
          utils.botReply(bot, userID, channelID, "you forgot to choose who to fight!", command, msg.id, false);
          return;
        }

        if (msg.mentions.length > 1) {
          utils.botReply(bot, userID, channelID, "wow! Calm down there, no need to take on more than you can chew! (one fight at a time)", command, msg.id, false);
          return;
        }

        let strings = [", but they tripped over a rock and fell in the ocean", ", but they hurt themselves in confusion", ". SHORYUKEN!", ". HADOUKEN!", ". KA-POW!", " with a pillow", " with a large fish", ", but they stumbled over their shoelaces", ", but they missed", " with a burnt piece of toast", ", but it wasn't very effective..."];
        let randomNumber = Math.floor((Math.random() * strings.length));
        bot.createMessage(channelID, msg.author.username + " is fighting <@" + msg.mentions[0].id + ">" + strings[randomNumber]);
        break;

    }
  },
  roles: [
      config.roles.adminRole,
      config.roles.trelloModRole,
      config.roles.devRole,
      config.roles.hunterRole
  ],
  channels: [
      config.channels.allChannels
  ]
};
module.exports = fun;
