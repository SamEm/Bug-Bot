const Eris = require('eris');
const config = require('./config.js');
const fs = require('fs');
var dataFile = require('./dataFile.json');

var Trello = require("node-trello");
var t = new Trello(config.trelloKey, config.trelloToken);

var bot = new Eris(config.botToken);

bot.on("error", err => {
    console.log("@" + bot.user.username + " - " + "ERROR:\n" + err.stack);
});

bot.on("ready", () => {
    console.log('Ready!');
});

function delay(delayMS) {
  return function(arg){
    return new Promise((resolve) => {
      setTimeout(() => resolve(arg), delayMS);
    });
  }
}

var maxTries = 0;

bot.on('guildMemberUpdate', (guild, member, oldMember) => {
  if(!!oldMember && oldMember.roles.indexOf(config.hunterRole) <= -1 && member.roles.indexOf(config.hunterRole) > -1){
    bot.createMessage(config.bugHunterChannel, 'Welcome <@' + member.user.id + '> to the Bug Hunters™!');
  }
});


bot.on('messageCreate', (msg) => {
    var messageSplit = msg.content.split(' ');
    var command = messageSplit.shift();

    var channelID = msg.channel.id;
    var userTag = msg.author.username + "#" + msg.author.discriminator;
    var userID = msg.author.id;

    if(!!msg.member.roles) {
      var roles = msg.member.roles;
    }else {
      var roles = [];
    }
    
      switch (command.toLowerCase()) {
        case "!android":
          var android = config.androidAlphaRole;
          var index = roles.indexOf(android);
          if(index === -1){
            roles.push(android);
            bot.editGuildMember(msg.guild.id, userID, {
              roles: roles
            }).then(() => {
              bot.createMessage(channelID, "<@" + userID + ">, you have been given the role of `Android Alpha`. Use the same command again to remove this role from yourself.").then(delay(config.delayInMS)).then((innerMsg) => {
                bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                bot.deleteMessage(channelID, msg.id);
              }).catch((err) => {
                console.log("#1 " + err);
              });
              bot.createMessage(config.modLogChannel, "Gave `Android Alpha` to **" + userTag + "**");
            });
          }else{
            roles.splice(index, 1);
            bot.editGuildMember(msg.guild.id, userID, {
              roles: roles
            }).then(() => {
              bot.createMessage(channelID, "<@" + userID + ">, you have been removed from the `Android Alpha` role. Use the same command again to add this role to yourself.").then(delay(config.delayInMS)).then((innerMsg) => {
                bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                bot.deleteMessage(channelID, msg.id);
              }).catch((err) => {
                console.log("#2 " + err);
              });
              bot.createMessage(config.modLogChannel, "Removed `Android Alpha` from **" + userTag + "**");
            });
          }
        break;
        case "!ios":
          var ios = config.iosTestflightRole;
          var index = roles.indexOf(ios);
          if(index === -1){
            roles.push(ios);
            bot.editGuildMember(msg.guild.id, userID, {
              roles: roles
            }).then(() => {
              bot.createMessage(channelID, "<@" + userID + ">, you have been given the role of `iOSTestflight`. Use the same command again to remove this role from yourself.").then(delay(config.delayInMS)).then((innerMsg) => {
                bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                bot.deleteMessage(channelID, msg.id);
              }).catch((err) => {
                console.log("#3 " + err);
              });
              bot.createMessage(config.modLogChannel, "Gave `iOSTestflight` to **" + userTag + "**");
            });
          }else{
            roles.splice(index, 1);
            bot.editGuildMember(msg.guild.id, userID, {
              roles: roles
            }).then(() => {
              bot.createMessage(channelID, "<@" + userID + ">, you have been removed from the `iOSTestflight` role. Use the same command again to add this role to yourself.").then(delay(config.delayInMS)).then((innerMsg) => {
                bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                bot.deleteMessage(channelID, msg.id);
              }).catch((err) => {
                console.log("#4 " + err);
              });
              bot.createMessage(config.modLogChannel, "Removed `iOSTestflight` from **" + userTag + "**");
            });
          }
        break;
      }

    if(channelID === config.androidChannel || channelID === config.canaryChannel || channelID === config.iosChannel || channelID === config.linuxChannel){

      if(command.toLowerCase() === "!addnote"){
        var joinedMessage = messageSplit.join(' ');

        var trelloURL = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$2");
        var note = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$5");

        t.get("/1/cards/" + trelloURL, { }, function(errorURL, urlData) {
          if(!!urlData && !!urlData.id && urlData.closed === false){
            if(note === trelloURL){
              bot.createMessage(channelID, "<@" + userID + ">, please provide a note").then(delay(config.delayInMS)).then((innerMsg) => {
                bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                bot.deleteMessage(channelID, msg.id);
              }).catch((err) => {
                console.log("#5 " + err);
              });
            }else{
              repro(note, undefined, channelID, trelloURL, userID, userTag, undefined, undefined, msg.id);
            }
          }else{
            bot.createMessage(channelID, "<@" + userID + ">, please provide a valid URL, a note, and make sure the issue is not closed.").then(delay(config.delayInMS)).then((innerMsg) => {
              bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
              bot.deleteMessage(channelID, msg.id);
            }).catch((err) => {
              console.log("#6 " + err);
            });
          }
        });
      }

      if(command.toLowerCase() === "!canrepro"){
        var joinedMessage = messageSplit.join(' ');
        var trelloURL = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$2");
        var clientInfo = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$5");
        var canReproTries = 0;
        var reproduction = "Can reproduce.";
        var emoji = "\n✅ ";

        if(!!trelloURL && (clientInfo !== trelloURL)){
          preRepro(trelloURL, clientInfo, reproduction, userTag, channelID, msg.id, userID, emoji);
        }else{
          bot.createMessage(channelID, "<@" + userID + ">, please provide a valid URL, a client version, and make sure the issue is not closed.").then(delay(config.delayInMS)).then((innerMsg) => {
            bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
            bot.deleteMessage(channelID, msg.id);
          }).catch((err) => {
            console.log("#6 " + err);
          });
        }
      }

      if(command.toLowerCase() === "!cannotrepro" || command.toLowerCase() === "!cantrepro"){
        var joinedMessage = messageSplit.join(' ');
        var trelloURL = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$2");
        var clientInfo = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$5");
        var cantReproTries = 0;
        var reproduction = "Can't reproduce.";
        var emoji = "\n❌ ";

        if(!!trelloURL && (clientInfo !== trelloURL)){
          preRepro(trelloURL, clientInfo, reproduction, userTag, channelID, msg.id, userID, emoji);
        }else{
          bot.createMessage(channelID, "<@" + userID + ">, please provide a valid URL, a client version, and make sure the issue is not closed.").then(delay(config.delayInMS)).then((innerMsg) => {
            bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
            bot.deleteMessage(channelID, msg.id);
          }).catch((err) => {
            console.log("#7 " + err);
          });
        }
      }

      if(command.toLowerCase() === "!attach"){
        var dev = msg.member.roles.indexOf(config.devRole);
        var hunter = msg.member.roles.indexOf(config.hunterRole);
        var admin = msg.member.roles.indexOf(config.adminRole);

        if(dev > -1 || hunter > -1 || admin > -1){
          var attachment;
          var joinedMessage = messageSplit.join(' ');

          var trelloURL = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$2");
          var attachmentUrl = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$5");
          t.get("/1/cards/" + trelloURL, { }, function(errorURL, urlData) {
            if(!!urlData && !!urlData.id && urlData.closed === false){
              if(!!msg.attachments[0]){
                attachment = msg.attachments[0].url;
                addAttachment(channelID, attachment, trelloURL, userID, trelloURL, urlData.name, userTag);
                bot.createMessage(channelID, "<@" + userID + "> your attachment has been added.").then(delay(config.delayInMS)).then((innerMsg) => {
                  bot.deleteMessage(channelID, innerMsg.id);
                }).catch((err) => {
                  console.log("#8 " + err);
                });
              }else if(!!attachmentUrl.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig)){
                attachment = attachmentUrl;
                addAttachment(channelID, attachment, trelloURL, userID, trelloURL, urlData.name, userTag);
                bot.createMessage(channelID, "<@" + userID + "> your attachment has been added.").then(delay(config.delayInMS)).then((innerMsg) => {
                  bot.deleteMessage(channelID, innerMsg.id);
                }).catch((err) => {
                  console.log("#9 " + err);
                });
              }else{
                bot.createMessage(channelID, "<@" + userID + "> Please include a valid image").then(delay(config.delayInMS)).then((innerMsg) => {
                  bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                  bot.deleteMessage(channelID, msg.id);
                }).catch((err) => {
                  console.log("#10 " + err);
                });
              }

            }else if(!!dataFile.reports[trelloURL] && dataFile.reports[trelloURL].status === "open"){
              if(!!msg.attachments[0]){
                attachment = msg.attachments[0].url;
                dataFile.reports[trelloURL].attachment.push(msg.attachments[0].url);
                bot.getMessages(config.bugApprovalChannel).then(data => {
                  var infoFind = data.find(function(foundObj){
                    return foundObj.author.id === config.botID && foundObj.content.indexOf(trelloURL) > -1;
                  });
                  bot.editMessage(config.bugApprovalChannel, infoFind.id, infoFind.content + "\n" + attachment);
                }).catch((err) => {
                  console.log("#Extra One\n" + err);
                });
                var newAttachment = JSON.stringify(dataFile, null, 2);
                fs.writeFile("./dataFile.json", newAttachment, function(err){
                  if(!!err){
                    console.log("#11 " + err);
                  }
                });
                bot.createMessage(channelID, "<@" + userID + "> your attachment has been added.").then(delay(config.delayInMS)).then((innerMsg) => {
                  bot.deleteMessage(channelID, innerMsg.id);
                }).catch((err) => {
                  console.log("#12 " + err);
                });
              }else if(!!attachmentUrl.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig)){
                attachment = attachmentUrl;
                dataFile.reports[trelloURL].attachment.push(attachment);
                bot.getMessages(config.bugApprovalChannel).then(data => {
                  var infoFind = data.find(function(foundObj){
                    return foundObj.author.id === config.botID && foundObj.content.indexOf(trelloURL) > -1;
                  });
                  if(!!infoFind){
                    bot.editMessage(config.bugApprovalChannel, infoFind.id, infoFind.content + "\n" + attachment);
                  }
                }).catch((err) => {
                  console.log("#13 " + err);
                });
                bot.createMessage(channelID, "<@" + userID + "> your attachment has been added.").then(delay(config.delayInMS)).then((innerMsg) => {
                  bot.deleteMessage(channelID, innerMsg.id);
                }).catch((err) => {
                  console.log("#14 " + err);
                });
                var newAttachment = JSON.stringify(dataFile, null, 2);
                fs.writeFile("./dataFile.json", newAttachment, function(err){
                  if(!!err){
                    console.log("#15 " + err);
                  }
                });
              }else{
                bot.createMessage(channelID, "<@" + userID + "> Please include a valid image").then(delay(config.delayInMS)).then((innerMsg) => {
                  bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                  bot.deleteMessage(channelID, msg.id);
                }).catch((err) => {
                  console.log("#16 " + err);
                });
              }
            }else{
              bot.createMessage(channelID, "<@" + userID + "> Please include a valid trello link or queue ID").then(delay(config.delayInMS)).then((innerMsg) => {
                bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                bot.deleteMessage(channelID, msg.id);
              }).catch((err) => {
                console.log("#17 " + err);
              });
            }
          });
        }else{
          bot.createMessage(channelID, "<@" + userID + ">, only people with the role of Bug Hunter or higher can use that command, in order to prevent spam and abuse. Just ask any Bug Hunter™ and they'll be more than happy to help you out.").then(delay(config.delayInMS)).then((msg_id) => {
            bot.deleteMessage(msg_id.channel.id, msg_id.id);
            bot.deleteMessage(channelID, msg.id);
          }).catch((err) => {
            console.log("#18 " + err);
          });
        }
      } // Add attachments to reports // Attach files to existing reports

      if(command.toLowerCase() === "!edit"){
        var dev = msg.member.roles.indexOf(config.devRole);
        var hunter = msg.member.roles.indexOf(config.hunterRole);
        var admin = msg.member.roles.indexOf(config.adminRole);

        if(dev > -1 || hunter > -1 || admin > -1){

          var joinedMessage = messageSplit.join(' ');
          var splitter = msg.content.match(/\|/g);
          var trelloURL = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)? \| ([\s\S]*)/gi, "$2");
          var report = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)? \| ([\s\S]*)/gi, "$5");

          var lowerCaseReport = report.toLowerCase();
          var matchFormat = lowerCaseReport.match(/\bsteps to reproduce|expected result|actual result/gi);

          if(!!splitter && splitter.length < 2) {
            if(!!matchFormat && matchFormat.indexOf('steps to reproduce') > -1) {
              if(!!matchFormat && matchFormat.indexOf('expected result') > -1) {
                if(!!matchFormat && matchFormat.indexOf('actual result') > -1) {

                  t.get("/1/cards/" + trelloURL, { }, function(errorURL, urlData) {
                    if(!!urlData && !!urlData.id && urlData.closed === false){

                      var section2 = report.match(/(steps to reproduce(s)?(:)?)([\s\S]*)(?=expected result(s)?(:)?)/gi);
                      var section3 = report.match(/(expected result(s)?(:)?)([\s\S]*)(?=actual result(s)?(:)?)/gi);

                      var systemClient = lowerCaseReport.match(/\b(?:system setting(s)?(:)?)|\b(?:client version(s)?(:)?)/gi);

                      if(!!systemClient && systemClient.length === 1 && systemClient.indexOf('system setting') > -1) {
                        var section4 = report.match(/(actual result(s)?(:)?)([\s\S]*)(?=system setting(s)?(:)?)/gi);
                        var section5 = report.match(/(system setting(s)?(:)?)([\s\S]*)/gi);

                        var section4Content = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                        var section5Content = section5[0].replace(/(System Setting(s)?(:)?)([\s\S]*)/gi, '$4');
                        var combinedSections = section4Content + "\n####System settings:\n" + section5Content;
                        var repostCombinedSections = section4Content + "\n**System settings:**" + section5Content;
                      }else if(!!systemClient && systemClient.length === 1 && systemClient.indexOf('client version') > -1) {
                        var section4 = report.match(/(actual result(s)?(:)?)([\s\S]*)(?=client version(s)?(:)?)/gi);
                        var section5 = report.match(/(client version(s)?(:)?)([\s\S]*)/gi);

                        var section4Content = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                        var section5Content = section5[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                        var combinedSections = section4Content + "\n####Client version:\n" + section5Content;
                        var repostCombinedSections = section4Content + "\n**Client version:**" + section5Content;
                      }else if(!!systemClient && systemClient.length === 2){
                        if(systemClient[0] === "client version"){

                          var section4 = report.match(/(actual result(s)?(:)?)([\s\S]*)(?=client version(s)?(:)?)/i);
                          var section4Content = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');

                          var section5 = report.match(/(client version(s)?(:)?)([\s\S]*)(?=system setting(s)?(:)?)/i);
                          var section5Content = section5[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');

                          var section6 = report.match(/(system setting(s)?(:)?)([\s\S]*)/i);
                          var section6Content = section6[0].replace(/(system setting(s)?(:)?)([\s\S]*)/gi, '$4');

                        }else if(systemClient[0] === "system setting"){

                          var section4 = report.match(/(actual result(s)?(:)?)([\s\S]*)(?=system setting(s)?(:)?)/i);
                          var section4Content = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');

                          var section5 = report.match(/(system setting(s)?(:)?)([\s\S]*)(?=client version(s)?(:)?)/i);
                          var section5Content = section5[0].replace(/(system setting(s)?(:)?)([\s\S]*)/gi, '$4');

                          var section6 = report.match(/(client version(s)?(:)?)([\s\S]*)/i);
                          var section6Content = section6[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                        }
                        var combinedSections = section4Content + "\n####System settings:\n" + section5Content + "\n####Client version:\n" + section6Content;
                        var repostCombinedSections = section4Content + "\n**System settings:**" + section5Content + "\n**Client version:**" + section6Content;
                      }else{
                        var section4 = report.match(/(actual result(s)?(:)?)([\s\S]*)/gi);
                        var section4Content = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                        var combinedSections = section4Content;
                        var repostCombinedSections = section4Content;
                      }

                      var section2Content = section2[0].replace(/(steps to reproduce(s)?(:)?)([\s\S]*)/gi, '$4');
                      var section3Content = section3[0].replace(/(expected result(s)?(:)?)([\s\S]*)/gi, '$4');

                      if(!section2){
                        section2.push(' ');
                      }else if(!section3){
                        section3.push(' ');
                      }else if(!section4){
                        section4.push(' ');
                      }

                      if(section2[0].indexOf(' - ') > -1){
                        var section2String = section2Content.replace(/(-)\s/g, '\n$&'); // give new lines to the list
                        if(!section2String){
                          section2String.push(' ');
                        }
                        const reportString = "Reported by " + userTag + '\n\n####Steps to reproduce:' + section2String + '\n\n####Expected result:\n' + section3Content + '\n####Actual result:\n' + combinedSections;

                        if(!!msg.attachments[0]){
                          bot.createMessage(channelID, "<@" + userID + "> please use the attach command to attach images instead of embeding images to the edit report").then(delay(config.delayInMS)).then((innerMsg) => {
                            bot.deleteMessage(channelID, innerMsg.id);
                          });
                        }
                        bot.getMessages(channelID).then((data) => {
                          var dataFinder = data.find(function(foundObj) {
                            return foundObj.author.id === config.botID && foundObj.content.indexOf('https://trello.com/c/' + trelloURL) > -1 && foundObj.content.indexOf('Reproducibility:') > -1;
                          });
                          var returnedChatMsg = dataFinder.content.split('**Reproducibility:**');
                          var header = returnedChatMsg[0].match(/(?:\*\*Short description:\*\*\s)(.*)/i);
                          var trelloLinkInMsg = returnedChatMsg[0].match(/(https:\/\/trello.com\/c\/[A-Za-z0-9\?&=]+)/i);
                          const editReportChatString = "---------------------------------------------\nReported by " + userTag + "\n**Short description:** " + header[1] + "\n**Steps to reproduce:** " + section2String + "\n**Expected result:** " + section3Content + "\n**Actual result:** " + repostCombinedSections;
                          var cleanEditReport = editReportChatString.replace(/((http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)\.(?:jpg|gif|png))/gim, "");
                          var fixedEditMessage = cleanEditReport + '\n<' + trelloLinkInMsg[1] + '>\n\n**Reproducibility:**' + returnedChatMsg[1];

                          editTrelloCard(trelloURL, channelID, reportString, '<@' + userID + '>', userTag, msg.id, fixedEditMessage, dataFinder.id);
                        }).catch((err) => {
                          console.log("#Extra Two\n" + err);
                        });
                      }else{
                        bot.createMessage(channelID, "<@" + userID + "> Please format the reproduction steps correctly ` - step one - step two - step three (etc)`").then(delay(config.delayInMS)).then((innerMsg) => {
                          bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                        });
                      }
                    }else{
                      bot.createMessage(channelID, "<@" + userID + "> I can’t find that issue in Trello or the Queue. Please double check the URL or ID.").then(delay(config.delayInMS)).then((innerMsg) => {
                        bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                      });
                    }
                  });
                }else{
                  bot.createMessage(channelID, "<@" + userID + ">, you need to include `Actual Result:`").then(delay(config.delayInMS)).then((innerMsg) => {
                    bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                  });
                }
              }else{
                bot.createMessage(channelID, "<@" + userID + ">, you need to include `Expected Result:`").then(delay(config.delayInMS)).then((innerMsg) => {
                  bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                });
              }
            }else{
              bot.createMessage(channelID, "<@" + userID + ">, you need to include `Steps to Reproduce: - step one - step two - step three (etc)`").then(delay(config.delayInMS)).then((innerMsg) => {
                bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
              });
            }
          }else{
            bot.createMessage(channelID, "<@" + userID + ">, please include **one** pipe `|`").then(delay(config.delayInMS)).then((innerMsg) => {
              bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
            });
          }
        }else{
          bot.createMessage(channelID, "<@" + userID + ">, only people with the role of Bug Hunter or higher can use that command, in order to prevent spam and abuse. Just ask any Bug Hunter™ and they'll be more than happy to help you out.").then(delay(config.delayInMS)).then((msg_id) => {
            bot.deleteMessage(msg_id.channel.id, msg_id.id);
          });
        }
      } // Edit an existing reports
      if(command.toLowerCase() === "!title"){
        var dev = msg.member.roles.indexOf(config.devRole);
        var hunter = msg.member.roles.indexOf(config.hunterRole);
        var admin = msg.member.roles.indexOf(config.adminRole);

          if(dev > -1 || hunter > -1 || admin > -1){
            var joinedMessage = messageSplit.join(' ');
            var trelloURL = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$2");
            var newTitle = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)? \| ([\s\S]*)/gi, "$5");

            t.get("/1/cards/" + trelloURL, { }, function(errorURL, urlData) {
              if(!!urlData && !!urlData.id && urlData.closed === false){
                if(!!trelloURL && (newTitle !== trelloURL)){
                  bot.getMessages(channelID).then((data) => {
                    var dataFinder = data.find(function(foundObj) {
                      return foundObj.author.id === config.botID && foundObj.content.indexOf('https://trello.com/c/' + trelloURL) > -1 && foundObj.content.indexOf('Reproducibility:') > -1;
                    });
                    if(!!dataFinder){
                      var editReportString = dataFinder.content.replace(/(Short description(s)?(:)?)([^\r\n]*)/gi, 'Short description:** ' + newTitle);
                      updateTrelloCardTitle(trelloURL, channelID, newTitle, '<@' + userID + '>', userTag, msg.id, editReportString, dataFinder.id);
                    }else{
                      updateTrelloCardTitle(trelloURL, channelID, newTitle, '<@' + userID + '>', userTag, msg.id, null, null);
                    }
                  }).catch((err) => {
                     console.log("#Extra Three\n" + err);
                  });
                }else{
                  bot.createMessage(channelID, "<@" + userID + ">, please include **one** pipe `|`").then(delay(config.delayInMS)).then((innerMsg) => {
                    bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                  });
                }
              }else{
                bot.createMessage(channelID, "<@" + userID + ">, please provide a valid URL, a new title, and make sure the issue is not closed.").then(delay(config.delayInMS)).then((innerMsg) => {
                  bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                  bot.deleteMessage(channelID, msg.id);
                });
              }
            });
          }else{
            bot.createMessage(channelID, "<@" + userID + ">, only people with the role of Bug Hunter or higher can use that command, in order to prevent spam and abuse. Just ask any Bug Hunter™ and they'll be more than happy to help you out.").then(delay(config.delayInMS)).then((msg_id) => {
              bot.deleteMessage(msg_id.channel.id, msg_id.id);
              bot.deleteMessage(channelID, msg.id);
            });
          }
        } // Edit an existing report's header
      if(command.toLowerCase() === "!severity"){
        var dev = msg.member.roles.indexOf(config.devRole);

          if(dev > -1){
            var joinedMessage = messageSplit.join(' ');
            var trelloURL = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$2");
            var newLabel = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)? \| ([\s\S]*)/gi, "$5");

            t.get("/1/cards/" + trelloURL, { }, function(errorURL, urlData) {
              if(!!urlData && !!urlData.id && urlData.closed === false){
                if(!!trelloURL && (newLabel !== trelloURL)){
                  bot.getMessages(channelID).then((data) => {
                    var dataFinder = data.find(function(foundObj) {
                      return foundObj.author.id === config.botID && foundObj.content.indexOf('https://trello.com/c/' + trelloURL) > -1 && foundObj.content.indexOf('Reproducibility:') > -1;
                    });
                    if(!!dataFinder){
                      if (newLabel.toLowerCase().indexOf('p') === 0) // bool check for isPriority
                        updateTrelloLabel(trelloURL, channelID, newLabel, '<@' + userID + '>', userTag, msg.id, true);
                      else
                        updateTrelloLabel(trelloURL, channelID, newLabel, '<@' + userID + '>', userTag, msg.id, false);
                    }else{
                      updateTrelloLabel(trelloURL, channelID, null, '<@' + userID + '>', userTag, msg.id, false);
                    }
                  });
                }else{
                  bot.createMessage(channelID, "<@" + userID + ">, please include **one** pipe `|`").then(delay(config.delayInMS)).then((innerMsg) => {
                    bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                  });
                }
              }else{
                bot.createMessage(channelID, "<@" + userID + ">, please provide a valid URL, a severity (P3 - P0, MI), and make sure the issue is not closed.").then(delay(config.delayInMS)).then((innerMsg) => {
                  bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                  bot.deleteMessage(channelID, msg.id);
                });
              }
            });
          }else{
            bot.createMessage(channelID, "<@" + userID + ">, only Discord Employees can use this command.").then(delay(config.delayInMS)).then((msg_id) => {
              bot.deleteMessage(msg_id.channel.id, msg_id.id);
              bot.deleteMessage(channelID, msg.id);
            });
          }
        } // Set the severity of a report
      if(command.toLowerCase() === "!submit"){ // Submit a report
        var dev = msg.member.roles.indexOf(config.devRole);
        var hunter = msg.member.roles.indexOf(config.hunterRole);
        var admin = msg.member.roles.indexOf(config.adminRole);

        var splitter = msg.content.match(/\|/g);
        var joinedMessage = messageSplit.join(' ');

        const pipe = joinedMessage.indexOf("|");
        const header = joinedMessage.substr(0, pipe).trim();
        var report = joinedMessage.substr(pipe + 1).trim();

        var lowerCaseReport = report.toLowerCase();
        var matchFormat = lowerCaseReport.match(/\bsteps to reproduce|expected result|actual result/gi);

        if(!!splitter && splitter.length < 2){
          if(!!matchFormat && matchFormat.indexOf('steps to reproduce') > -1){
            if(!!matchFormat && matchFormat.indexOf('expected result') > -1){
              if(!!matchFormat && matchFormat.indexOf('actual result') > -1){

                var section2 = report.match(/(steps to reproduce(s)?(:)?)([\s\S]*)(?=expected result(s)?(:)?)/gi);
                var section3 = report.match(/(expected result(s)?(:)?)([\s\S]*)(?=actual result(s)?(:)?)/gi);

                var systemClient = lowerCaseReport.match(/\b(?:system setting)|\b(?:client version)/gi);
                if(!!systemClient && systemClient.length === 1 && systemClient.indexOf('system setting') > -1){
                  var section4 = report.match(/(actual result(s)?(:)?)([\s\S]*)(?=system setting(s)?(:)?)/gi);
                  var section5 = report.match(/(system setting(s)?(:)?)([\s\S]*)/gi);

                  var section4Content = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                  var section5Content = section5[0].replace(/(system setting(s)?(:)?)([\s\S]*)/gi, '$4');
                  var combinedSections = section4Content + "\n####System settings:\n" + section5Content;
                  var repostCombinedSections = section4Content + "\n**System settings:**" + section5Content;
                }else if(!!systemClient && systemClient.length === 1 && systemClient.indexOf('client version') > -1){
                  var section4 = report.match(/(actual result(s)?(:)?)([\s\S]*)(?=client version(s)?(:)?)/gi);
                  var section5 = report.match(/(client version(s)?(:)?)([\s\S]*)/gi);

                  var section4Content = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                  var section5Content = section5[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                  var combinedSections = section4Content + "\n####Client version:\n" + section5Content;
                  var repostCombinedSections = section4Content + "\n**Client version:**" + section5Content;
                }else if(!!systemClient && systemClient.length === 2){
                  if(systemClient[0] === "client version"){

                    var section4 = report.match(/(actual result(s)?(:)?)([\s\S]*)(?=client version(s)?(:)?)/i);
                    var section4Content = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');

                    var section5 = report.match(/(client version(s)?(:)?)([\s\S]*)(?=system setting(s)?(:)?)/i);
                    var section5Content = section5[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');

                    var section6 = report.match(/(system setting(s)?(:)?)([\s\S]*)/i);
                    var section6Content = section6[0].replace(/(system setting(s)?(:)?)([\s\S]*)/gi, '$4');

                  }else if(systemClient[0] === "system setting"){

                    var section4 = report.match(/(actual result(s)?(:)?)([\s\S]*)(?=system setting(s)?(:)?)/i);
                    var section4Content = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');

                    var section5 = report.match(/(system setting(s)?(:)?)([\s\S]*)(?=client version(s)?(:)?)/i);
                    var section5Content = section5[0].replace(/(system setting(s)?(:)?)([\s\S]*)/gi, '$4');

                    var section6 = report.match(/(client version(s)?(:)?)([\s\S]*)/i);
                    var section6Content = section6[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                  }
                  var combinedSections = section4Content + "\n####System settings:\n" + section5Content + "\n####Client version:\n" + section6Content;
                  var repostCombinedSections = section4Content + "\n**System settings:**" + section5Content + "\n**Client version:**" + section6Content;
                }else{
                  var section4 = report.match(/(actual result(s)?(:)?)([\s\S]*)/gi);
                  var section4Content = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                  var combinedSections = section4Content;
                  var repostCombinedSections = section4Content;
                }

                var section2Content = section2[0].replace(/(steps to reproduce(s)?(:)?)([\s\S]*)/gi, '$4');
                var section3Content = section3[0].replace(/(expected result(s)?(:)?)([\s\S]*)/gi, '$4');

                if(!section2){
                  section2.push(' ');
                }else if(!section3){
                  section3.push(' ');
                }else if(!section4){
                  section4.push(' ');
                }

                if(section2[0].indexOf(' - ') > -1){

                  var section2String = section2Content.replace(/(-)\s/g, '\n$&'); // give new lines to the list

                  if(!section2String){
                    section2String.push(' ');
                  }

                  const reportStringSubmit = '\n\n####Steps to reproduce:' + section2String + '\n\n####Expected result:\n' + section3Content + '\n####Actual result:\n' + combinedSections;
                  const repostReportString = "\n**Short description:** " + header + "\n**Steps to reproduce:** " + section2String + "\n**Expected result:** " + section3Content + "\n**Actual result:** " + repostCombinedSections;
                  var cleanRepostReport = repostReportString.replace(/((http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)\.(?:jpg|gif|png))/gim, "");

                  if(!!msg.attachments[0]){
                    bot.createMessage(channelID, "<@" + userID + "> please use the attach command to attach images instead of embeding images to the submit report").then(delay(config.delayInMS)).then((innerMsg) => {
                      bot.deleteMessage(channelID, innerMsg.id);
                    });
                  }

                  if(channelID === config.iosChannel){
                    var listID = config.iosCard;
                    queueReport(reportStringSubmit, header, cleanRepostReport, channelID, userTag, msg.id, config.iosChannel, listID, userID, msg.content);
                  }else if(channelID === config.androidChannel){
                    var listID = config.androidCard;
                    queueReport(reportStringSubmit, header, cleanRepostReport, channelID, userTag, msg.id, config.androidChannel, listID, userID, msg.content);
                  }else if(channelID === config.canaryChannel){
                    var listID = config.canaryCard;
                    queueReport(reportStringSubmit, header, cleanRepostReport, channelID, userTag, msg.id, config.canaryChannel, listID, userID, msg.content);
                  }else if (channelID === config.linuxChannel) {
                    var listID = config.linuxCard;
                    queueReport(reportStringSubmit, header, cleanRepostReport, channelID, userTag, msg.id, config.linuxChannel, listID, userID, msg.content);
                  }

                }else{
                  bot.createMessage(channelID, "<@" + userID + "> Please format the reproduction steps correctly ` - step one - step two - step three (etc)`").then(delay(config.delayInMS)).then((innerMsg) => {
                    bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                  }).catch((err) => {
                    console.log("#19 " + err);
                  });
                }
              }else{
                bot.createMessage(channelID, "<@" + userID + ">, you need to include `Actual Result:`").then(delay(config.delayInMS)).then((innerMsg) => {
                  bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                }).catch((err) => {
                  console.log("#20 " + err);
                });
              }
            }else{
              bot.createMessage(channelID, "<@" + userID + ">, you need to include `Expected Result:`").then(delay(config.delayInMS)).then((innerMsg) => {
                bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
              }).catch((err) => {
                console.log("#21 " + err);
              });
            }
          }else{
            bot.createMessage(channelID, "<@" + userID + ">, you need to include `Steps to Reproduce: - step one - step two - step three (etc)`").then(delay(config.delayInMS)).then((innerMsg) => {
              bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
            }).catch((err) => {
              console.log("#22 " + err);
            });
          }
        }else{
          bot.createMessage(channelID, "<@" + userID + ">, please include **one** pipe `|`").then(delay(config.delayInMS)).then((innerMsg) => {
            bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
          }).catch((err) => {
            console.log("#23 " + err);
          });
        }
      }
    }

    if(command.toLowerCase() === "!ping"){
      var dev = msg.member.roles.indexOf(config.devRole);
      var tMod = msg.member.roles.indexOf(config.trelloModRole);
      var admin = msg.member.roles.indexOf(config.adminRole);

      if(dev > -1 || admin > -1 || tMod > -1){
        bot.createMessage(channelID, "Pong!").then(delay(config.delayInMS)).then((innerMsg) =>{
          bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
          bot.deleteMessage(innerMsg.channel.id, msg.id);
        }).catch((err) => {
          console.log("#Ping " + err);
        });
      }
    }

    if((command.toLowerCase() === "!approve" || command.toLowerCase() === "!deny") && channelID === config.bugApprovalChannel){
      var dev = msg.member.roles.indexOf(config.devRole);
      var hunter = msg.member.roles.indexOf(config.hunterRole);
      var admin = msg.member.roles.indexOf(config.adminRole);
      if(dev > -1 || hunter > -1 || admin > -1){
        if(!!messageSplit[0] && dataFile.reports.hasOwnProperty(messageSplit[0])){
          var info = dataFile.reports[messageSplit[0]];

          if(command.toLowerCase() === "!approve" && info.status === "open"){ // Approve report
            if(info.userID !== userID){
              var recievedMessage = messageSplit.join(' ');
              var contentMessage = recievedMessage.match(/(\d*)\s*\|\s*([\s\S]*)/i);
              if(!!contentMessage){
                if(info.hunter.indexOf(userID) === -1){
                  info.hunter.push(userID);
                  info.approvedBy++;
                  info.hunterTag.push(userTag);
                  info.hunterReproSystem.push(contentMessage[2]);
                  var newAPUserCount = JSON.stringify(dataFile, null, 2);
                  fs.writeFile('./dataFile.json', newAPUserCount, function(err){
                    if(!!err){
                      console.log("#24 " + err);
                    }
                    if(info.approvedBy === 3){ //Report is approved and sent to Trello
                      var listID = info.listID,
                          header = info.header,
                          reportStringSubmit = info.reportMessage,
                          loggedChannelID = info.channelID,
                          os = info.os,
                          loggedUserTag = info.userTag,
                          cleanRepostReport = info.cleanRepostReport,
                          loggedMsgID = info.msgID,
                          loggedUserID = info.userID,
                          uniqueID = info.reportID;

                      sendToTrello(listID, header, reportStringSubmit, loggedChannelID, os, loggedUserTag, cleanRepostReport, loggedMsgID, loggedUserID, uniqueID);

                      bot.createMessage(config.modLogChannel, "**" + userTag + "** approves of user report **#" + messageSplit[0] + "** `" + info.header + "`");

                      bot.createMessage(channelID, "<@" + userID + "> you've successfully added your approval for this report. 2/2").then(delay(config.delayInMS)).then(innerMsg => {
                        bot.deleteMessage(channelID, innerMsg.id);
                        bot.deleteMessage(channelID, msg.id);
                      }).catch((err) => {
                        console.log("#25 " + err);
                      });

                      bot.deleteMessage(config.bugApprovalChannel, loggedMsgID);


                      info.status = "approved";
                      var newStatus = JSON.stringify(dataFile, null, 2);
                      fs.writeFile("./dataFile.json", newStatus, function(err){
                        if(!!err){
                          console.log("#26 " + err);
                        }
                      });
                    }else{
                      bot.createMessage(channelID, "<@" + userID + "> you've successfully added your approval for this report.").then(delay(config.delayInMS)).then(innerMsg => {
                        bot.deleteMessage(channelID, innerMsg.id);
                        bot.deleteMessage(channelID, msg.id);
                        bot.getMessages(config.bugApprovalChannel).then(data => {
                          var infoFind = data.find(function(foundObj){
                            return foundObj.author.id === config.botID && foundObj.content.indexOf(messageSplit[0]) > -1;
                          });
                          var splitMsg = infoFind.content.split("Report ID: **" + messageSplit[0] + "**");
                          var message = splitMsg[0] + "Report ID: **" + messageSplit[0] + "**" + "\n✅ " + userTag + " **APPROVED** this report." + splitMsg[1];
                          bot.editMessage(config.bugApprovalChannel, infoFind.id, message);
                        }).catch((err) => {
                          console.log("#27 " + err);
                        });
                      }).catch((err) => {
                        console.log("#28 " + err);
                      });
                      bot.createMessage(config.modLogChannel, "**" + userTag + "** approves of user report **#" + messageSplit[0] + "** `" + info.header + "`");
                    };
                  });
                }else{
                  bot.createMessage(channelID, "<@" + userID + "> you've already given your input on this report.").then(delay(config.delayInMS)).then(innerMsg => {
                    bot.deleteMessage(channelID, innerMsg.id);
                    bot.deleteMessage(channelID, msg.id);
                  }).catch((err) => {
                    console.log("#29 " + err);
                  });
                }
              }else{
                bot.createMessage(channelID, "<@" + userID + "> please include your system settings.").then(delay(config.delayInMS)).then(innerMsg => {
                  bot.deleteMessage(channelID, innerMsg.id);
                  bot.deleteMessage(channelID, msg.id);
                }).catch((err) => {
                  console.log("#30 " + err);
                });
              }
            }else{
              bot.createMessage(channelID, "<@" + userID + ">, you can't approve your own report.").then(delay(config.delayInMS)).then(innerMsg => {
                bot.deleteMessage(channelID, innerMsg.id);
                bot.deleteMessage(channelID, msg.id);
              }).catch((err) => {
                console.log("#31 " + err);
              });
            }

          }else if(command.toLowerCase() === "!deny" && info.status === "open"){ // Close report
            var recievedMessage = messageSplit.join(' ');
            var contentMessage = recievedMessage.match(/(\d*)\s*\|\s*([\s\S]*)/i);
            if(!!contentMessage){
              if(info.hunter.indexOf(userID) === -1){
                info.hunter.push(userID);
                info.deniedBy++;
                info.denialReason.push(contentMessage[2]);
                var newDNUserCount = JSON.stringify(dataFile, null, 2);
                fs.writeFile('./dataFile.json', newDNUserCount, function(err){
                  if(info.deniedBy === 3){ // Report is denied and reporter is DMd a message
                    info.status = "denied";
                    var newStatus = JSON.stringify(dataFile, null, 2);
                    fs.writeFile("./dataFile.json", newStatus, function(err){
                      bot.createMessage(channelID, "<@" + userID + ">, you've successfully denied this report.").then(delay(config.delayInMS)).then(innerMsg => {
                        bot.deleteMessage(channelID, innerMsg.id);
                        bot.deleteMessage(channelID, msg.id);
                        bot.deleteMessage(config.bugApprovalChannel, info.msgID).then(() => {
                          bot.createMessage(config.bugApprovalChannel, "`" + info.header + "` was denied for:\n- `" + info.denialReason.join('`\n- `') + "`").then(delay(config.minuteDelay)).then((msgInfo) => {
                            bot.deleteMessage(config.bugApprovalChannel, msgInfo.id);
                          });
                        });
                      });
                    });
                    var userInfo = msg.member.guild.members.get(info.userID);
                    bot.getDMChannel(info.userID).then(DMInfo => {
                      bot.createMessage(DMInfo.id, "Hi " + DMInfo.recipient.username + ", unfortunately the bug you reported earlier: `" + info.header + "` was denied because:\n- `" + info.denialReason.join('`\n- `') + "`\n\nYou should try adding as much information as you can when you resubmit it. Here are some helpful tips:\n- Does your bug only happen on a specific version of the operating system?\n- Does your bug only happen on a specific device?\n- Try to be as specific as possible. Generalities like \"it glitches\" aren't helpful and lead to confusion.\n- Try to keep each repro step to a single action.\n\nThank you though for the report and we look forward to your next one! :thumbsup:\n\nBelow you'll find your original submit message:\n```\n" + info.cleanRepostReport + "```");
                    }).catch((err) => {
                      console.log("#32 " + err);
                    });
                    bot.createMessage(config.modLogChannel, "**" + userTag + "** denied user report **#" + messageSplit[0] + "** `" + info.header + "` | `" + contentMessage[2] + "`");
                  }else{
                    bot.createMessage(channelID, "<@" + userID + "> you've successfully denied this report.").then(delay(config.delayInMS)).then(innerMsg => {
                      bot.deleteMessage(channelID, innerMsg.id);
                      bot.deleteMessage(channelID, msg.id);
                    }).catch((err) => {
                      console.log("#33 " + err);
                    });
                    bot.getMessages(config.bugApprovalChannel).then(data => {
                      var infoFind = data.find(function(foundObj){
                        return foundObj.author.id === config.botID && foundObj.content.indexOf(messageSplit[0]) > -1;
                      });
                      var splitMsg = infoFind.content.split("Report ID: **" + messageSplit[0] + "**");
                      var message = splitMsg[0] + "Report ID: **" + messageSplit[0] + "**" + "\n❌ " + userTag + " **DENIED** this report because `" + contentMessage[2] + "`." + splitMsg[1];
                      bot.editMessage(config.bugApprovalChannel, infoFind.id, message);
                    }).catch((err) => {
                      console.log("#33 " + err);
                    });
                    bot.createMessage(config.modLogChannel, "**" + userTag + "** denied user report **#" + messageSplit[0] + "** `" + info.header + "` | `" + contentMessage[2] + "`");
                  }
                });
              }else{
                //Already approved or denied report
                bot.createMessage(channelID, "<@" + userID + "> you've already given your input on this report.").then(delay(config.delayInMS)).then(innerMsg => {
                  bot.deleteMessage(channelID, innerMsg.id);
                  bot.deleteMessage(channelID, msg.id);
                }).catch((err) => {
                  console.log("#34 " + err);
                });
              }
            }else{
              bot.createMessage(channelID, "<@" + userID + "> please include a reason for denying the report.").then(delay(config.delayInMS)).then(innerMsg => {
                bot.deleteMessage(channelID, innerMsg.id);
                bot.deleteMessage(channelID, msg.id);
              }).catch((err) => {
                console.log("#35 " + err);
              });
            }

          }else if((command.toLowerCase() === "!deny" || command.toLowerCase() === "!approve") && info.status !== "open"){
            bot.createMessage(channelID, "<@" + userID + "> this report has already been closed.").then(delay(config.delayInMS)).then(innerMsg => {
              bot.deleteMessage(channelID, innerMsg.id);
              bot.deleteMessage(channelID, msg.id);
            }).catch((err) => {
              console.log("#36 " + err);
            });
          }
        }else{
          bot.createMessage(channelID, "Please provide a valid report ID").then(delay(config.delayInMS)).then(innerMsg => {
            bot.deleteMessage(channelID, innerMsg.id);
            bot.deleteMessage(channelID, msg.id);
          }).catch((err) => {
            console.log("#37 " + err);
          });
        }
      }
    }
});

function queueReport(reportStringSubmit, header, cleanRepostReport, channelID, userTag, msgID, os, listID, userID, submitReport){
  var lastEntry = Object.keys(dataFile.reports).sort().reverse()[0];
  var uniqueID = dataFile.reports[lastEntry].reportID + 1;
  if(!dataFile.reports.hasOwnProperty(uniqueID)){
    dataFile.reports[uniqueID] = {
      header: header,
      reportMessage: reportStringSubmit,
      cleanRepostReport: cleanRepostReport,
      uncutReport: submitReport,
      attachment: [],
      channelID: channelID,
      userTag: userTag,
      listID: listID,
      status: "open",
      os: os,
      reportID: uniqueID,
      approvedBy: 0,
      deniedBy: 0,
      userID: userID,
      hunter: [],
      hunterTag: [],
      denialReason: [],
      hunterReproSystem: []
    };
    var jsonObj = JSON.stringify(dataFile, null, 2);
    fs.writeFile('./dataFile.json', jsonObj, function(err){
      bot.createMessage(config.bugApprovalChannel, "---------------------------------------------\n<#" + os + ">: **" + userTag + " Reported:**" + cleanRepostReport + '\n\nThe report above needs to be approved.\nReport ID: **' + uniqueID + '**\n').then(innerMsg => {
        dataFile.reports[uniqueID].msgID = innerMsg.id;
        var JSONobj = JSON.stringify(dataFile, null, 2);
        fs.writeFile('./dataFile.json', JSONobj, function(err){
          if(!!err){
            console.log("#38 " + err);
          }
        });
      }).catch((err) => {
        console.log("#39 " + err);
      });
      bot.createMessage(channelID, "<@" + userID + ">, your bug has been added to the approval queue. You will be notified when the status of your report updates.").then(delay(config.delayInMS)).then(innerMsg => {
        bot.deleteMessage(channelID, innerMsg.id);
        bot.deleteMessage(channelID, msgID);
      }).catch((err) => {
        console.log("#40 " + err);
      });
      if(!!err){
        console.log("#41 " + err);
      }
    });
    maxTries = 0;
  }else if(maxTries <= 5){
    queueReport(reportStringSubmit, header, repostReportString, channelID, userTag, msgID, os);
    maxTries + 1;
  }else{
    bot.createMessage(channelID, "Something went wrong, please try again");
    maxTries = 0;
  }
}

var queueReproQueue = 1;
function queueRepro(uniqueID, channelID, trelloURL){
  var info = dataFile.reports[uniqueID];

  if(info.status === "approved"){
    var reproduction = "Can reproduce."
    var emoji = "\n✅ ";
    var lengthOfRepro = info.approvedBy;
  }else if (info.status === "denied") {
    var reproduction = "Can't reproduce."
    var emoji = "\n❌ ";
    var lengthOfRepro = info.deniedBy;
  }


  if(queueReproQueue > lengthOfRepro){
    queueReproQueue = 1;
  }else if(queueReproQueue <= lengthOfRepro && lengthOfRepro >= 2){

    var userTag = info.hunterTag[queueReproQueue - 1];
    var clientInfo = info.hunterReproSystem[queueReproQueue - 1];
    queueReproQueue++;
    preRepro(trelloURL, clientInfo, reproduction, userTag, channelID, null, null, emoji, uniqueID);
    setTimeout(function() {
      queueRepro(uniqueID, channelID, trelloURL);
    }, 2000);
  }
}

var preReproTries = 0;
function preRepro(trelloURL, clientInfo, reproduction, userTag, channelID, msgID, userID, emoji, uniqueID){
  t.get("/1/cards/" + trelloURL, { }, function(errorURL, urlData) {
    if(!!urlData){
      if(!!urlData.id && urlData.closed === false){
        bot.getMessages(channelID).then((data) => {
          var dataFinder = data.find(function(foundObj) {
            return foundObj.author.id === config.botID && foundObj.content.indexOf('https://trello.com/c/' + trelloURL) > -1 && foundObj.content.indexOf('Reproducibility:') > -1;
          });
          if(!!dataFinder){
            var splitMsg = dataFinder.content.split("**Reproducibility:**");

            var editMsgCreate = splitMsg[0] + "**Reproducibility:**" + emoji + userTag + splitMsg[1];
            if(clientInfo === trelloURL){
              repro(clientInfo, reproduction, channelID, trelloURL, userID, userTag, dataFinder.id, editMsgCreate, msgID);
            }else{
              repro(clientInfo, reproduction, channelID, trelloURL, userID, userTag, dataFinder.id, editMsgCreate, msgID);
            }
          }else{
            repro(clientInfo, reproduction, channelID, trelloURL, userID, userTag, null, null, msgID);
          }
        }).catch((err) => {
          console.log("#42 " + err);
        });
      }else if(urlData.closed === true){
        bot.createMessage(channelID, "<@" + userID + ">, this bug has already been closed.").then(delay(config.delayInMS)).then(innerMsg => {
          bot.deleteMessage(channelID, innerMsg.id);
          bot.deleteMessage(channelID, msgID);
        }).catch((err) => {
          console.log("#43 " + err);
        });
      }else if(!urlData.id){
        bot.createMessage(channelID, "<@" + userID + ">, incorrect url.").then(delay(config.delayInMS)).then(innerMsg => {
          bot.deleteMessage(channelID, innerMsg.id);
          bot.deleteMessage(channelID, msgID);
        }).catch((err) => {
          console.log("#44 " + err);
        });
      }
    }else{
      if(preReproTries >= 5){
        preRepro(trelloURL, clientInfo, reproduction, userTag, channelID, msgID, userID, emoji);
        preReproTries++;
      }else{
        bot.createMessage(channelID, "Something went wrong, please try again later.").then(delay(config.delayInMS)).then(innerMsg => {
          bot.deleteMessages(channelID, innerMsg.id);
        }).catch((err) => {
          console.log("#45 " + err);
        });
        preReproTries = 0;
      }
    }
  });
}

function repro(recievedData, reproduction, channelID, trelloURL, userID, userTag, editMsgID, editMsgContent, msgID){
  if(!!reproduction){
    var mergedContent = reproduction + '\n' + recievedData;
  }else{
    var mergedContent = recievedData;
  }

  var sentRepro = function(error, info){
    if(!!error){
      bot.createMessage(channelID, "Something went wrong, please try again").then(delay(config.delayInMS)).then((innerMsg) => {
        bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
      }).catch((err) => {
        console.log("#46 " + err);
      });
    }else{
      if(!!userID){
        bot.createMessage(channelID, "<@" + userID + ">, your note has been added to the ticket.").then(delay(config.delayInMS)).then((msg_id) => {
          bot.deleteMessage(msg_id.channel.id, msg_id.id);
          bot.deleteMessage(channelID, msgID);
        }).catch((err) => {
          console.log("#47 " + err);
        });
        if(!!editMsgID && !!editMsgContent){
          bot.editMessage(channelID, editMsgID, editMsgContent);
          bot.createMessage(config.modLogChannel, "**" + userTag + "**: " + reproduction + " `" + info.data.card.name + "` <http://trello.com/c/" + info.data.card.shortLink + ">");
        }else if(!!reproduction && !editMsgID && !editMsgContent){
          bot.createMessage(config.modLogChannel, "**" + userTag + "**: " + reproduction + " `" + info.data.card.name + "` <http://trello.com/c/" + info.data.card.shortLink + ">");
        }else {
          bot.createMessage(config.modLogChannel, "**" + userTag + "**: Added a note to `" + info.data.card.name + "` <http://trello.com/c/" + info.data.card.shortLink + ">");
        }
      }else{
        bot.editMessage(channelID, editMsgID, editMsgContent);
      }
    }
  }
  var reproInfo = {
    text: mergedContent + "\n\n" + userTag
  }
  t.post("/1/cards/" + trelloURL + "/actions/comments", reproInfo, sentRepro);
}

function addAttachment(channelID, attachment, cardID, userID, trelloURL, urlDateName, userTag){

  var attachmentAdded = function(attachmentAddedErr, dataAttachment){
    if(!!attachmentAddedErr){
      bot.createMessage(channelID, "Something went wrong, please try again").then(delay(config.delayInMS)).then((innerMsg) => {
        bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
      }).catch((err) => {
        console.log("#48 " + err);
      });
    }else{
      /*
      bot.getMessages(channelID).then((data) => {
        var dataFinder = data.find(function(foundObj) {
          return foundObj.author.id === config.botID && foundObj.content.indexOf('https://trello.com/c/' + trelloURL) > -1 && foundObj.content.indexOf('Reproducibility:') > -1;
        });
        if(!!dataFinder){
          bot.editMessage(channelID, dataFinder.id, dataFinder.content + "\n" + attachment);
        }
      });
      */
      bot.createMessage(config.modLogChannel, "**" + userTag + "** added an attachment to `" + urlDateName + "` <https://trello.com/c/" + trelloURL + ">");
    }
  }
  var addAttachment = {
    url: attachment,
    name: userTag
  }
  t.post('/1/cards/' + cardID + '/attachments', addAttachment, attachmentAdded);
}

var attachmentQueueNumber = 0;
function queueAttachment(key, msgID, channelID, trelloID){
  var info = dataFile.reports[key];
  if(attachmentQueueNumber !== info.attachment.length && attachmentQueueNumber < info.attachment.length){
    var attachmentAdded = function(attachmentAddedErr, dataAttachment){
      if(!!attachmentAddedErr){
        console.log("Queue attach: " + attachmentAddedErr);
      }
      /*
      bot.getMessage(channelID, msgID).then((innerMsg) => {
        var message = innerMsg.content + "\n" + info.attachment[attachmentQueueNumber];
        bot.editMessage(channelID, msgID, message);
      });
      */
    }
    var addAttachment = {
      url: info.attachment[attachmentQueueNumber]
    }
    t.post('/1/cards/' + trelloID + '/attachments', addAttachment, attachmentAdded);

    attachmentQueueNumber++;
    queueAttachment(key, msgID, channelID, trelloID);
  }else{
    attachmentQueueNumber = 0;
  }
}

function sendToTrello(listID, header, report, channelID, whereFrom, userTag, repostReportString, msgID, loggedUserID, uniqueID){
  var creationSuccess = function(creationSuccessErr, data) {
    if(!!creationSuccessErr){
      console.log(creationSuccessErr);
    }

    bot.createMessage(channelID, "---------------------------------------------\nReported by " + userTag + repostReportString + "\n<" + data.shortUrl + ">\n\n**Reproducibility:**\n").then(delay(config.delayInMS)).then((innerMsg) => {
      bot.deleteMessage(channelID, msgID);
      if(dataFile.reports[uniqueID].attachment.length !== 0 && !!dataFile.reports[uniqueID].attachment[0]){
        queueAttachment(uniqueID, innerMsg.id, channelID, data.id);
      }
    });
    bot.createMessage(config.modLogChannel, "<#" + whereFrom + ">: **" + userTag + "** submitted this report `" + header + "` <" + data.shortUrl + ">");

    checkUserInfo(loggedUserID, userTag, whereFrom, data.shortUrl, uniqueID);

    dataFile.reports[uniqueID].trelloURL = data.shortUrl;
    var addTrelloURL = JSON.stringify(dataFile, null, 2);
    fs.writeFile('./dataFile.json', addTrelloURL, function(err){
      if(!!err){
        console.log("#51 " + err);
      }
      var trelloURL = data.shortUrl.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?/gi, "$2");
      queueRepro(uniqueID, channelID, trelloURL);
    });
  };
  var newCard = {
    name: header,
    desc: "Reported by " + userTag + report,
    idList: listID,
    pos: 'top'
  };
  t.post('/1/cards/', newCard, creationSuccess);
}

var reTestUserInfo = 0;

function checkUserInfo(loggedUserID, userTag, whereFrom, shortUrl, uniqueID) {
  var guild = bot.guilds.find(guild => guild.id === config.DTserverID);
  var userInfo = guild.members.get(loggedUserID);
    
    if(!!userInfo && userInfo.roles.indexOf(config.hunterRole) === -1) {
      var reporterUserID = dataFile.reports[uniqueID].userID;
      bot.createMessage(config.modLogChannel, "<@110813477156720640> " + userTag + " needs a rank");  // Ping dabbit for rank
      bot.getDMChannel(loggedUserID).then(DMInfo => {
        bot.createMessage(DMInfo.id, "The bug you reported has been approved! Thanks for your report! You can find your bug in <#" + whereFrom + "> <" + shortUrl + ">");
      }).catch((err) => {
        console.log("#50 " + err);
      });
      reTestUserInfo = 0;
    } else if(!userInfo && reTestUserInfo <= 5) {
      checkUserInfo(loggesUserID, userTag, whereFrom, shortUrl);
      reTestUserInfo++;
    } else {
      bot.createMessage(config.modLogChannel, "<@84815422746005504> Couldn't fetch user info on userTag, user might need a new role!");
      reTestUserInfo = 0;
    }
}

function editTrelloCard(cardID, channelID, report, userID, userTag, msgID, editReportString, editMsgID){
  var cardUpdated = function(error, data){
    bot.editMessage(channelID, editMsgID, editReportString);
    bot.createMessage(channelID, userID + ", the Bug Report at <" + data.shortUrl + "> has been successfully updated.").then(delay(config.delayInMS)).then((msg_id) => {
      bot.deleteMessage(msg_id.channel.id, msg_id.id);
      bot.deleteMessage(channelID, msgID);
    }).catch((err) => {
      console.log("#53 " + err);
    });
    bot.createMessage(config.modLogChannel, "**" + userTag + "** edited this report `"  + data.name + "` <" + data.shortUrl + ">");
  }
  var updateCard = {
    value: report
  }
  t.put('/1/cards/' + cardID + '/desc', updateCard, cardUpdated);
}


function updateTrelloCardTitle(cardID, channelID, newTitle, userID, userTag, msgID, editReportString, editMsgID) {
  var cardUpdated = function(error, data){
      if(!!editReportString && !!editMsgID){
        bot.editMessage(channelID, editMsgID, editReportString);
      }
      bot.createMessage(channelID, userID + ", the Bug Report title at <" + data.shortUrl + "> has been successfully updated.").then(delay(config.delayInMS)).then((msg_id) => {
        bot.deleteMessage(msg_id.channel.id, msg_id.id);
        bot.deleteMessage(channelID, msgID);
      });
      bot.createMessage(config.modLogChannel, "**" + userTag + "** edited the title of report `"  + data.name + "` <" + data.shortUrl + ">");
  }
  var updateCard = {
    value: newTitle
  }
  t.put('/1/cards/' + cardID + '/name', updateCard, cardUpdated);
}

function updateTrelloLabel(cardID, channelID, newLabel, userID, userTag, msgID, isPriority) {
  var labelUpdated = function(error, data){
      bot.createMessage(channelID, userID + ", your chosen severity has been added to <" + data.shortUrl + ">.").then(delay(config.delayInMS)).then((msg_id) => {
        bot.deleteMessage(msg_id.channel.id, msg_id.id);
        bot.deleteMessage(channelID, msgID);
      });
      bot.createMessage(config.modLogChannel, "**" + userTag + "** edited the severity of report `"  + data.name + "` <" + data.shortUrl + ">");
  }
  if(!!newLabel) { // handling the null case
    // a very dirty way to do it, unfortunately. needs improvement!
    var newLabelID = ''; // We will need these two later
    var createNewLabelID = '';
    if(!!isPriority) { // Priorities usage will remove the previous one and apply the new one
      switch(channelID) {
        case config.androidChannel:
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.droidP3Label); // We first remove all the priority labels
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.droidP2Label);
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.droidP1Label);
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.droidP0Label);
          createNewLabelID = 'config.droid' + newLabel + 'Label'; // Create a new priority label with given label
          break;
        case config.canaryChannel:
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.canP3Label);
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.canP2Label);
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.canP1Label);
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.canP0Label);
          createNewLabelID = 'config.can' + newLabel + 'Label';
          break;
        case config.iosChannel:
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.iosP3Label);
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.iosP2Label);
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.iosP1Label);
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.iosP0Label);
          createNewLabelID = 'config.ios' + newLabel + 'Label';
          break;
        case config.linuxChannel:
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.linuxP3Label);
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.linuxP2Label);
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.linuxP1Label);
          t.delete('/1/cards/' + cardID + '/idLabels/' + config.linuxP0Label);
          createNewLabelID = 'config.linux' + newLabel + 'Label';     
          break;
      }
    }
    else { // Need More Info is a one-way street, you can't remove it through the bot (Dabbit was OK with this)
      switch(channelID) {
        case config.androidChannel:
          createNewLabelID = 'config.droid' + newLabel + 'Label';
          break;
        case config.canaryChannel:
          createNewLabelID = 'config.can' + newLabel + 'Label';
          break;
        case config.iosChannel:
          createNewLabelID = 'config.ios' + newLabel + 'Label';
          break;
        case config.linuxChannel:
          createNewLabelID = 'config.linux' + newLabel + 'Label';
          break;
      }
    }
    newLabelID = eval(createNewLabelID); // eval the new name to grab the ID associated to it
    
    var updateLabel = {
          value: newLabelID
    }
    
    t.post('/1/cards/' + cardID + '/idLabels', updateLabel, labelUpdated);
  }
}
bot.connect();
