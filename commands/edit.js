"use strict";
const config = require('../config');
const trelloUtils = require('../src/trelloUtils');
const utils = require('../src/utils');
const qUtils = require('../src/queueUtils');

let edit = {
  pattern: /!edit/i,
  execute: function(bot, channelID, userTag, userID, command, msg, trello, db) {
    let splitters = msg.content.match(/\|/g);
    let messageSplit = msg.content.split(' ');
    messageSplit.shift();
    let joinedMessage = messageSplit.join(' ');

    let matchString = joinedMessage.match(/(?:(?:<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(?:\/|\>)?(?:[\w-\d]*)?(?:\/|\>|\/>)?\s*\|\s*([\s\S]*)\s\|\s*([\s\S]*)/i);

    if(!matchString) {
      utils.botReply(bot, userID, channelID, "please provide a URL, section you want to edit and your new content", command, msg.id);
      return;
    }

    let key = matchString[1];
    let editSection = matchString[2];
    let newContent = matchString[3];
    //only reporter and mods+ can edit
    db.get("SELECT userid, reportString, reportMsgID, reportStatus, trelloURL FROM reports WHERE trelloURL = ? OR id = ?", [key, key], function(error, report) {

      let getPerms = msg.member.roles.indexOf(config.roles.devRole) && msg.member.roles.indexOf(config.roles.adminRole) && msg.member.roles.indexOf(config.roles.trelloModRole);

      if(getPerms === -1 && !!report && report.userid !== userID) {
        utils.botReply(bot, userID, channelID, "only the reporter, or mods+ can modify reports", command, msg.id, false);
        return;
      }

      if(!!report && report.reportStatus === "trello") {
        key = report.trelloURL;
      }

      var matchFormat = editSection.match(/\b(header|title|short description|body|str|steps to reproduce|expected|expected result|actual|actual result|cs|client|client setting|ss|system|system setting)(s)?(:)?/i);
      if(!splitters || splitters.length !== 2){
        utils.botReply(bot, userID, channelID, "please include two splitters, like this: `!edit <key/url> | <what part you want to change> | <the new content>`", command, msg.id, false);
        return;
      }
      if(!matchFormat){
        utils.botReply(bot, userID, channelID, "please include the section you want to change. Look in #Bot-Help for a full list of sections.", command, msg.id);
        return;
      }

      let cleanNewContent;
      if(!!newContent.match(/(\*|\`|\~|\_|ˋ)/i)){
        cleanNewContent = escapeMD(newContent);
      } else {
        cleanNewContent = newContent;
      }

      if(!cleanNewContent) {
        utils.botReply(bot, userID, channelID, "you forgot to add your new content!", command, msg.id);
        return;
      }

      switch (editSection) {
        case "header":
        case "title":
        case "short description":
          editSection = "short description";
        break;
        case "body":
        case "str":
        case "steps to reproduce":
          cleanNewContent = cleanNewContent.replace(/(-)\s/gi, '\n$&');
          editSection = "steps to reproduce";
        break;
        case "expected":
          editSection = "expected result";
        break;
        case "actual":
          editSection = "actual result";
        break;
        case "cs":
        case "client":
          editSection = "client setting";
        break;
        case "ss":
        case "system":
          editSection = "system setting";
        break;
      }

      trello.get("/1/cards/" + key, {}, function(errorTrello, urlData) {

        if(!report && !urlData && !urlData.id) { //Check if the key is correct
          utils.botReply(bot, userID, channelID, "I can't seem to find the report on Trello or in the Queue, you should double check your key.", command, msg.id, false);
          return;
        } else if(!!urlData && urlData.closed === true) { // check if in trello, but closed

          utils.botReply(bot, userID, channelID, "this report has already been closed.", command, msg.id, false);
          return;
        }

        if(!!report) {
          if(report.reportStatus === "queue") { //Report is in queue
            qUtils.editDBReport(bot, trello, db, userTag, userID, key, editSection, newContent, msg, channelID, report.reportString);
            bot.getMessage(config.channels.queueChannel, report.reportMsgID).then((oldReport) => {
              if(!!oldReport) {
                let pattern = "" + editSection + "s?:\\s*(?:\\*)*\\s*([\\s\\S]*?)(?=(?:\\s*\\n)?\\*\\*|\\n\\n)";
                let newRegex = new RegExp(pattern, "i");

                let editReport = oldReport.content.replace(newRegex, utils.toTitleCase(editSection) + ":** " + cleanNewContent);
                bot.editMessage(config.channels.queueChannel, report.reportMsgID, editReport).then(() => {
                  utils.botReply(bot, userID, channelID, " `" + utils.toTitleCase(editSection) + "` has been updated", command, msg.id, false);
                  bot.createMessage(config.channels.modLogChannel, ":pencil2: **" + userTag + "** edited **#" + key + "** `" + utils.toTitleCase(editSection) + "`");
                }).catch((error) => {
                  console.log("Edit | msgQueue\n" + error);
                });
              }
            }).catch((error) => {console.log("Edit | Queue getMsg\n" + error);});
          } else if(report.reportStatus === "trello") { //report is in DB and Trello (approved report)
            trelloUtils.editTrelloReport(bot, trello, userTag, userID, key, editSection, newContent, msg, channelID, urlData, msg.id, command);
            bot.getMessage(channelID, report.reportMsgID).then((oldReport) => {
              if(!!oldReport){
                let pattern = "" + editSection + "s?:\\s*(?:\\*)*\\s*([\\s\\S]*?)(?=(?:\\s*\\n)?\\*\\*|\\n\\n)";
                let newRegex = new RegExp(pattern, "i");

                let editReport = oldReport.content.replace(newRegex, utils.toTitleCase(editSection) + ":** " + cleanNewContent);
                bot.editMessage(channelID, report.reportMsgID, editReport).catch((err) => {console.log("Edit | trello Msg\n" + err);});
              }
            }).catch((error) => {console.log("Edit | Trello & DB getMsg\n" + error);});
          } else if(report.reportStatus === "closed") { //report has been denied
            utils.botReply(bot, userID, channelID, "this report has already been closed.", command, msg.id, false);
          }
        } else { // legacy report - Not in DB
          trelloUtils.editTrelloReport(bot, trello, userTag, userID, key, editSection, newContent, msg, channelID, urlData, msg.id, command);
          bot.getMessages(channelID).then((data) => {
            var dataFinder = data.find(function(foundObj) {
              return foundObj.author.id === config.botID && foundObj.content.indexOf('https://trello.com/c/' + key) > -1 && foundObj.content.indexOf('Reproducibility:') > -1;
            });
            if(!!dataFinder) {
              let pattern = "" + editSection + "s?:\\s*(?:\\*)*\\s*([\\s\\S]*?)(?=(?:\\s*\\n)?\\*\\*|\\n\\n)";
              let newRegex = new RegExp(pattern, "i");

              let editReport = dataFinder.content.replace(newRegex, utils.toTitleCase(editSection) + ":** " + cleanNewContent);
              bot.editMessage(channelID, dataFinder.id, editReport).catch((err) => {console.log("Edit | Legacy Msg\n" + err);});
            }
          }).catch((error) => {console.log("Edit | Legacy getMsg\n" + error);});
        }
      });
    });
  },
  roles: [
    config.roles.everybodyRole
    ],
  channels: [
    config.channels.iosChannel,
    config.channels.canaryChannel,
    config.channels.androidChannel,
    config.channels.linuxChannel,
    config.channels.queueChannel
  ]
}
module.exports = edit;
