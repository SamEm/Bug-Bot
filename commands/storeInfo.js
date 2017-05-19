"use strict";
const config = require("../config");
const utils = require("../src/utils");

let storeSysInfo = {
  pattern: /!storeinfo/i,
  execute: function(bot, channelID, userTag, userID, command, msg, trello, db) {
    let messageSplit = msg.content.split(' ');
    messageSplit.shift();
    let joinedMessage = messageSplit.join(' ');

    let contentInfo = joinedMessage.match(/(-l|-m|-w|-a|-i)\s*\|\s*([\s\S]*)/i);
    if(!contentInfo) {
      db.get("SELECT windows, ios, android, macOS, linux FROM users WHERE userid = ?", [userID], function(error, allInfo) {
        if(!allInfo) {
          utils.botReply(bot, userID, channelID, "you have no specs stored, please include which client and your specs. Like so: `" + command + " -i | 10.0.1`. Check #bot-help for full list", command, msg.id);
          return;
        }

        let infoObject = new Object();
        let fullInfoArray = [];

        infoObject.Windows = allInfo.windows;
        infoObject.iOS = allInfo.ios;
        infoObject.Android = allInfo.android;
        infoObject.macOS = allInfo.macOS;
        infoObject.Linux = allInfo.linux;

        for (var thisOS in infoObject) {
          if(!infoObject[thisOS]){
            fullInfoArray.push("**__" + thisOS + ":__**\n   None");
          } else {
            fullInfoArray.push("**__" + thisOS + ":__**\n   " + infoObject[thisOS]);
          }
        }

        bot.getDMChannel(userID).then((DMInfo) => {
          bot.createMessage(DMInfo.id, "Hey there <@" + userID + ">! Here's the stored info we have on you right now:\n" + fullInfoArray.join('\n')).then(() => {
            utils.botReply(bot, userID, channelID, "I just DM'ed you your info!", command, msg.id);
          }).catch(() => {
            utils.botReply(bot, userID, channelID, "I was not able to DM you, do you have them turned on?", command, msg.id);
          });
        }).catch((err) => {
          console.log("send DM storeInfo\n" + err);
        });
      });
      return;
    }

    if(!!contentInfo && (!contentInfo[1] || !contentInfo[2])) {
      utils.botReply(bot, userID, channelID, "please include which client and your specs. Like so: `!storeinfo -i | 10.0.1`. Check #bot-help for full list", command, msg.id);
      return;
    }
    let whichOS;
    let systemInfo = contentInfo[2];

    if(contentInfo[1] === "-w") {
      whichOS = "windows";
    } else if(contentInfo[1] === "-i") {
      whichOS = "ios";
    } else if(contentInfo[1] === "-l") {
      whichOS = "linux";
    } else if(contentInfo[1] === "-m") {
      whichOS = "macOS";
    } else if(contentInfo[1] === "-a") {
      whichOS = "android";
    } else {
      utils.botReply(bot, userID, channelID, "please include which client and your specs. Like so: `!storeinfo -i | 10.0.1`. Check #bot-help for full list", command, msg.id);
      return;
    }

    db.get("SELECT " + whichOS + " FROM users WHERE userid = ?", [userID], function(error, dbRowReply){
      if(!!error){
        console.log(error);
      }
      systemInfo = systemInfo.replace(/(\*|\`|\~|\_|ˋ)/gi, "");
      if(!!dbRowReply){
        //Edit existing database entry
        db.run("UPDATE users SET " + whichOS + " = ? WHERE userid = ?", [systemInfo, userID]);
        utils.botReply(bot, userID, channelID, "your new " + utils.toProperCase(whichOS) + " settings have been saved", command, msg.id);
        bot.createMessage(config.channels.modLogChannel, ":floppy_disk: **" + userTag + "** changed **" + utils.toProperCase(whichOS) + "** -> `" + systemInfo + "`"); //user changed their --- info
      }else if(!dbRowReply){
        //Create new database entry
        db.run("INSERT INTO users (userid, " + whichOS + ") VALUES(?, ?)", [userID, systemInfo]);
        utils.botReply(bot, userID, channelID, "your new " + utils.toProperCase(whichOS) + " settings have been saved", command, msg.id);
        bot.createMessage(config.channels.modLogChannel, ":floppy_disk: **" + userTag + "** added **" + utils.toProperCase(whichOS) + "** -> `" + systemInfo + "`"); //user added their --- info
      }
    });
  },
  roles: [
    config.roles.everybodyRole
    ],
  channels: [
    config.channels.allChannels
  ]
}
module.exports = storeSysInfo;
