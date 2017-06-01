"use strict";
const config = require("../config");
const customConfig = require('../configEdit');
const utils = require("./utils");
const tutils = require("./trelloUtils");

function deniedReport(bot, msg, db, key, reportInfo) {
  db.run("UPDATE reports SET reportStatus = 'closed' WHERE id = ?", [key]);
  db.all("SELECT info, userTag FROM reportQueueInfo WHERE id = ? AND stance = 'deny'", [key], function(error, DBReportInfo) {

    let DBReportInfoArray = DBReportInfo.map(function(allInfo){
      return allInfo.userTag + " | " + allInfo.info;
    });

    bot.deleteMessage(config.channels.queueChannel, reportInfo.reportMsgID).then(() => {
      bot.createMessage(config.channels.queueChannel, "**#" + key + "** | `" + reportInfo.header + "` was denied because:\n- `" + DBReportInfoArray.join("`\n- `") + "`").then(utils.delay(customConfig.minuteDelay)).then((dndRsn) => {
        bot.deleteMessage(config.channels.queueChannel, dndRsn.id).catch(() => {});
        bot.getDMChannel(reportInfo.userID).then((DMInfo) => {
          bot.createMessage(DMInfo.id, "Hi " + DMInfo.recipient.username + ", unfortunately the bug you reported earlier: `" + reportInfo.header + "` was denied because:\n- `" + DBReportInfoArray.join('`\n- `') +
          "`\n\nYou should try adding as much information as you can when you resubmit it. Here are some helpful tips:\n- Does your bug only happen on a specific version of the operating system?\n- Does your bug only happen on a specific device?\n- Try to be as specific as possible. Generalities like \"it glitches\" aren't helpful and lead to confusion.\n- Try to keep each repro step to a single action.\n\nThank you though for the report and we look forward to your next one! :thumbsup:\n\nBelow you'll find your original submit message:\n```\n!submit " +
          reportInfo.header + " | " + reportInfo.reportString + "```").catch(() => {
            bot.createMessage(config.channels.modLogChannel, ":warning: Can not DM **" + userTag + "**. Report **#" + key + "** denied.");
          });
        });
      }).catch((error) => {console.log("deniedReport | createMessage denied because:\n" + error)});
    }).catch(() => {});
  });
}

function queueReport (bot, userTag, userID, channelID, db, msg, reportCapLinks, queueReportString, header) {
  let reportID;
  db.serialize(function() {
    db.get("SELECT id FROM reports ORDER BY id DESC LIMIT 1", function(err, dbInfo) {
      if(!!err) {
        console.log(err);
      }
      if(!!dbInfo) {
        reportID = dbInfo.id + 1;
      } else {
        reportID = 1000;
      }

      let cardID;
      if(channelID === config.channels.iosChannel) {
        cardID = config.cards.iosCard;
      } else if(channelID === config.channels.androidChannel) {
        cardID = config.cards.androidCard;
      } else if(channelID === config.channels.canaryChannel) {
        cardID = config.cards.canaryCard;
      } else if(channelID === config.channels.linuxChannel) {
        cardID = config.cards.linuxCard;
      }
      queueReportString = escapeMD(queueReportString);
      bot.createMessage(config.channels.queueChannel, "───────────────────\n<#" + channelID + "> **" + userTag + "** Reported:\n" + queueReportString + "\n\nThe report above needs to be approved.\nReport ID: **" + reportID + "**\n").then((qMsg) => {
        let queueMsgID = qMsg.id;

        db.run("INSERT INTO reports(id, header, reportString, userID, userTag, cardID, reportStatus, canRepro, cantRepro, reportMsgID, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime())", [reportID, header, reportCapLinks, userID, userTag, cardID, 'queue', 0, 0, queueMsgID], function(err) {if(!!err){console.log(err);}}); //message ID of report in Queue, later changed to ID in main chat. And time the report was reported (for statistical purposes)
        utils.botReply(bot, userID, channelID, "your bug has been added to the approval queue. You will be notified when the status of your report updates.", null, msg.id, false);
        bot.createMessage(config.channels.modLogChannel, ":pencil: **" + userTag + "** submitted `" + header + "` in <#" + channelID + ">"); //log to bot-log
      }).catch((err) => {console.log("queueUtils | createQueue Msg\n" + err);});
    });
  });
}

function addAD(bot, channelID, userTag, userID, command, msg, db, key, ADcontent, checkQueueReport, reportInfo, editMsgCont, trello) {
  switch (command.toLowerCase()) {
    case "!approve":
      if(!!checkQueueReport) { //Update reportQueueInfo (User has already given their input and wants to change it)
        let cantRepro;
        let canRepro;
        db.run("UPDATE reportQueueInfo SET info = ?, stance = 'approve' WHERE id = ? AND userID = ? AND stance != 'note'", [ADcontent, key, userID], function() {
          if(checkQueueReport.stance === "deny"){
            cantRepro = reportInfo.cantRepro - 1;
            canRepro = reportInfo.canRepro + 1;
          } else {
            cantRepro = reportInfo.cantRepro;
            canRepro = reportInfo.canRepro;
          }
          db.run("UPDATE reports SET cantRepro = ?, canRepro = ? WHERE id = ?", [cantRepro, canRepro, key], function() {
            if(canRepro >= customConfig.approveAttempts) { // approve report
              tutils.addReportTrello(bot, key, db, trello);
            } else {
              if(!!editMsgCont) {
                let splitMsg = editMsgCont.content.split("Report ID: **" + key + "**");
                let split = splitMsg[1];

                let regex = "(\\<\\:greenTick\\:" + config.emotes.greenTick + "\\>|\\<\\:redTick\\:" + config.emotes.redTick + "\\>)\\s(\\*\\*" + userTag + "\\*\\*):?\\s(.*)";
                let newRegex = new RegExp(regex, "gi");

                let newRepro = "<:greenTick:" + config.emotes.greenTick + "> **" + userTag + "**: `" + ADcontent + "`";
                let replace = split.replace(newRegex, newRepro);
                let newMsg = splitMsg[0] + "Report ID: **" + key + "**" +  replace;
                bot.editMessage(config.channels.queueChannel, reportInfo.reportMsgID, newMsg).catch(err => {console.log("edit approve update\n" + err);}).catch((err) => {console.log("queueUtils | editApprove Msg\n" + err);});
              }
            }
            utils.botReply(bot, userID, channelID, "you've successfully changed your stance on report **#" + key + "**", command, msg.id);
            bot.createMessage(config.channels.modLogChannel, ":thumbsup: **" + userTag + "** updated their approval: **#" + key + "** `" + reportInfo.header + "` | `" + ADcontent + "`"); //log to bot-log
          });
        });
      } else { //new reportQueueInfo entries. Add XP here
        let canRepro = reportInfo.canRepro + 1;
        db.run("INSERT INTO reportQueueInfo (id, userID, userTag, info, stance) VALUES (?, ?, ?, ?, ?)", [key, userID, userTag, ADcontent, 'approve'], function() {
          db.run("UPDATE reports SET canRepro = ? WHERE id = ?", [canRepro, key], function() {
            if(canRepro >= customConfig.approveAttempts) { // approve report
              tutils.addReportTrello(bot, key, db, trello);
            } else {
              if(!!editMsgCont) {
                let splitMsg = editMsgCont.content.split("Report ID: **" + key + "**");
                let newMsg = splitMsg[0] + "Report ID: **" + key + "**\n<:greenTick:" + config.emotes.greenTick + "> **" + userTag + "**: `" + ADcontent + "`" + splitMsg[1];
                bot.editMessage(config.channels.queueChannel, reportInfo.reportMsgID, newMsg).catch(err => {console.log("edit approve new\n" + err);}).catch((err) => {console.log("queueUtils | addNewApproval Msg\n" + err);});
              }
            }
            utils.botReply(bot, userID, channelID, "you've successfully approved report **#" + key + "**", command, msg.id);
            bot.createMessage(config.channels.modLogChannel, ":thumbsup: **" + userTag + "** approved: **#" + key + "** `" + reportInfo.header + "` | `" + ADcontent + "`"); //log to bot-log
          });
        });
      }
    break;
    case "!deny":
      if(!!checkQueueReport) { //Update reportQueueInfo (User has already given their input and wants to change it)
        let cantRepro;
        let canRepro;
        db.run("UPDATE reportQueueInfo SET info = ?, stance = 'deny' WHERE id = ? AND userID = ? AND stance != 'note'", [ADcontent, key, userID], function() {
          if(checkQueueReport.stance === "approve"){
            cantRepro = reportInfo.cantRepro + 1;
            canRepro = reportInfo.canRepro - 1;
          } else {
            cantRepro = reportInfo.cantRepro;
            canRepro = reportInfo.canRepro;
          }
          db.run("UPDATE reports SET cantRepro = ?, canRepro = ? WHERE id = ?", [cantRepro, canRepro, key], function() {
            if(cantRepro >= customConfig.denyAttempts) { // deny report
              deniedReport(bot, msg, db, key, reportInfo);
            } else {
              if(!!editMsgCont) {
                let splitMsg = editMsgCont.content.split("Report ID: **" + key + "**");
                let split = splitMsg[1];

                let regex = "(\\<\\:greenTick\\:" + config.emotes.greenTick + "\\>|\\<\\:redTick\\:" + config.emotes.redTick + "\\>)\\s(\\*\\*" + userTag + "\\*\\*):?\\s(.*)";
                let newRegex = new RegExp(regex, "gi");

                let newRepro = "<:redTick:" + config.emotes.redTick + "> **" + userTag + "**: `" + ADcontent + "`";
                let replace = split.replace(newRegex, newRepro);
                let newMsg = splitMsg[0] + "Report ID: **" + key + "**" + replace;

                bot.editMessage(config.channels.queueChannel, reportInfo.reportMsgID, newMsg).catch(err => {console.log("edit Deny update\n" + err);}).catch((err) => {console.log("queueUtils | editDenial Msg\n" + err);});
              }
            }
            utils.botReply(bot, userID, channelID, "you've successfully changed your stance on report **#" + key + "**", command, msg.id);
            bot.createMessage(config.channels.modLogChannel, ":thumbsdown: **" + userTag + "** updated their denial: **#" + key + "** `" + reportInfo.header + "` | `" + ADcontent + "`"); //log to bot-log
          });
        });
      } else { //new reportQueueInfo entries.
        let cantRepro = reportInfo.cantRepro + 1;
        db.run("INSERT INTO reportQueueInfo (id, userID, userTag, info, stance) VALUES (?, ?, ?, ?, ?)", [key, userID, userTag, ADcontent, 'deny'], function() {
          db.run("UPDATE reports SET cantRepro = ? WHERE id = ?", [cantRepro, key], function() {
            if(cantRepro >= customConfig.denyAttempts || reportInfo.userID === userID) { // deny report
              deniedReport(bot, msg, db, key, reportInfo);
            } else { //Add XP here
              if(!!editMsgCont) {
                let splitMsg = editMsgCont.content.split("Report ID: **" + key + "**");
                let newMsg = splitMsg[0] + "Report ID: **" + key + "**\n<:redTick:" + config.emotes.redTick + "> **" + userTag + "**: `" + ADcontent + "`" + splitMsg[1];
                bot.editMessage(config.channels.queueChannel, reportInfo.reportMsgID, newMsg).catch(err => {console.log("edit Deny new\n" + err);}).catch((err) => {console.log("queueUtils | newDenial Msg\n" + err);});
              }
            }
            utils.botReply(bot, userID, channelID, "you've successfully denied report **#" + key + "**", command, msg.id);
            bot.createMessage(config.channels.modLogChannel, ":thumbsdown: **" + userTag + "** denied: **#" + key + "** `" + reportInfo.header + "` | `" + ADcontent + "`"); //log to bot-log
          });
        });
      }
    break;
  }
}

function editDBReport(bot, trello, db, userTag, userID, key, editSection, newContent, msg, channelID, oldReportString) {
  if(editSection === "short description") {
    db.run("UPDATE reports SET header = ? WHERE id = ?", [newContent, key]);
  } else {
    let requiredFields = ["steps to reproduce", "expected result", "actual result", "client setting", "system setting"];
    let thisIndex = requiredFields.indexOf(editSection);
    let regex = "(" + editSection + ")s?:\\s*(.*)(?:" + requiredFields[thisIndex + 1] + ")";
    let newRegex = new RegExp(regex, "i");
    let newReport = oldReportString.replace(regex, newContent);
    db.run("UPDATE reports SET reportString = ? WHERE id = ?", [newReport, key]);
  }
}

module.exports = {
  queueReport: queueReport,
  addAD: addAD,
  editDBReport: editDBReport,
  deniedReport: deniedReport
}
