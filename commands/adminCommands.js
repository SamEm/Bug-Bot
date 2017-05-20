"use strict";
const config = require("../config");
const utils = require("../src/utils");
const adminUtils = require('../src/adminUtils');
const fs = require('fs');
const dateFormat = require('dateformat');

let adminCommands = {
  pattern: /!dapprove|!ddeny/i,
  execute: function(bot, channelID, userTag, userID, command, msg, trello, db) {
    let messageSplit = msg.content.split(' ');
    messageSplit.shift();
    let recievedMessage = messageSplit.join(' ');
    switch (command.toLowerCase()) {
      case "!dapprove":
      case "!ddeny":
        var contentMessage = recievedMessage.match(/(\d*)\s*\|\s*([\s\S]*)/i);
        if(!contentMessage){
          utils.botReply(bot, userID, channelID, "psst, did you forget system settings or your key?", command, msg.id, false);
          return;
        }
        let key = contentMessage[1];
        let whichClient = contentMessage[2].match(/(?:\B)(-l|-m|-w|-a|-i)(?:\b)/i);
        let ADContent;
        //Check if ADcontent exists or not, reply "missing reason/user settings" if it's missing
        if(!contentMessage[2]) {
          utils.botReply(bot, userID, channelID, "psst, you forgot your reason or system settings!", command, msg.id, false);
          return;
        } else if(!!whichClient) {
          whichClient[1] = whichClient[1].toLowerCase();
          let system;
          if(whichClient[1] === "-w") {
            system = "windows";
          } else if(whichClient[1] === "-i") {
            system = "iOS";
          } else if(whichClient[1] === "-l") {
            system = "linux";
          } else if(whichClient[1] === "-m") {
            system = "macOS";
          } else if(whichClient[1] === "-a") {
            system = "android";
          }
          db.get("SELECT " + system + " FROM users WHERE userid = ?", [userID], function(error, usrSys) {
            if(!!usrSys){
              ADContent = usrSys[system];
              adminUtils.queueOverride (bot, channelID, userTag, userID, command, msg, trello, db, key, ADContent);
            } else {
              utils.botReply(bot, userID, channelID, "doesn't seem like you have that client in the database. You can add it with `!addsys " + whichClient[1] + " | system info`", command, msg.id, false);
              return;
            }
          });

        } else {
          ADContent = contentMessage[2];
          adminUtils.queueOverride (bot, channelID, userTag, userID, command, msg, trello, db, key, ADContent);
        }

        break;s
    }
  },
  roles: [
    config.roles.adminRole,
    config.roles.devRole
    ],
  channels: [
    config.channels.allChannels
  ]
}
module.exports = adminCommands;
