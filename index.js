const Eris = require('eris');
const config = require('./config.js');

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

bot.on('guildMemberUpdate', (guild, member, oldMember) => {
  if(oldMember.roles.indexOf(config.hunterRole) <= -1 && member.roles.indexOf(config.hunterRole) > -1){
    bot.createMessage(config.bugHunterChannel, 'Welcome <@' + member.user.id + '> to the Bug Hunters™!');
  }
});

bot.on('messageCreate', (msg) => {
  var messageSplit = msg.content.split(' ');
  var command = messageSplit.shift();

  var channelID = msg.channel.id;
  var userTag = msg.author.username + "#" + msg.author.discriminator;
  var userID = msg.author.id;

    switch (command.toLowerCase()) {
      case "!android":
        var android = config.androidAlphaRole;
        var roles = msg.member.roles;
        var index = roles.indexOf(android);
        if(index === -1){
          roles.push(android);
          bot.editGuildMember(msg.guild.id, userID, {
            roles: roles
          }).then(() => {
            bot.createMessage(channelID, "<@" + userID + ">, you have been given the role of `Android Alpha`. Use the same command again to remove this role from yourself.").then(delay(config.delayInMS)).then((innerMsg) => {
              bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
              bot.deleteMessage(channelID, msg.id);
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
            });
            bot.createMessage(config.modLogChannel, "Removed `Android Alpha` from **" + userTag + "**");
          });
        }
      break;
      case "!ios":
        var ios = config.iosTestflightRole;
        var roles = msg.member.roles;
        var index = roles.indexOf(ios);
        if(index === -1){
          roles.push(ios);
          bot.editGuildMember(msg.guild.id, userID, {
            roles: roles
          }).then(() => {
            bot.createMessage(channelID, "<@" + userID + ">, you have been given the role of `iOSTestflight`. Use the same command again to remove this role from yourself.").then(delay(config.delayInMS)).then((innerMsg) => {
              bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
              bot.deleteMessage(channelID, msg.id);
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
            });
            bot.createMessage(config.modLogChannel, "Removed `iOSTestflight` from **" + userTag + "**");
          });
        }
      break;
    }

  if(channelID === config.androidChannel || channelID === config.canaryChannel || channelID === config.iosChannel){

    if(command.toLowerCase() === "!addnote"){
      var joinedMessage = messageSplit.join(' ');

      var trelloURL = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$2");
      var note = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$5");

      t.get("/1/cards/" + trelloURL, { }, function(errorURL, urlData) {
        if(!!urlData && !!urlData.id){
          if(note === trelloURL){
            bot.createMessage(channelID, "<@" + userID + ">, please provide a note").then(delay(config.delayInMS)).then((innerMsg) => {
              bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
              bot.deleteMessage(channelID, msg.id);
            });
          }else{
            repro(note, undefined, channelID, trelloURL, userID, userTag, undefined, undefined, msg.id);
          }
        }else{
          bot.createMessage(channelID, "<@" + userID + ">, please provide a valid URL and a note").then(delay(config.delayInMS)).then((innerMsg) => {
            bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
            bot.deleteMessage(channelID, msg.id);
          });
        }
      });
    }

    if(command.toLowerCase() === "!canrepro" || command.toLowerCase() === "!canrepo"){
      var joinedMessage = messageSplit.join(' ');

      var trelloURL = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$2");
      var clientInfo = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$5");

      t.get("/1/cards/" + trelloURL, { }, function(errorURL, urlData) {
        if(!!urlData && !!urlData.id){
          var reproduction = "Can reproduce.";
          bot.getMessages(channelID).then((data) => {
            var dataFinder = data.find(function(foundObj) {
              return foundObj.author.id === config.botID && foundObj.content.indexOf('https://trello.com/c/' + trelloURL) > -1;
            });
            var editMsgCreate = dataFinder.content + "\n✅ " + userTag;
            if(clientInfo === trelloURL){
              repro(clientInfo, reproduction, channelID, trelloURL, userID, userTag, dataFinder.id, editMsgCreate, msg.id);
            }else{
              repro(clientInfo, reproduction, channelID, trelloURL, userID, userTag, dataFinder.id, editMsgCreate, msg.id);
            }
          });
        }else{
          bot.createMessage(channelID, "<@" + userID + ">, please provide a valid URL and a client version").then(delay(config.delayInMS)).then((innerMsg) => {
            bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
            bot.deleteMessage(channelID, msg.id);
          });
        }
      });
    }

    if(command.toLowerCase() === "!cannotrepro" || command.toLowerCase() === "!cantrepro" || command.toLowerCase() === "!cantrepo" || command.toLowerCase() === "!cannotrepo"){
      var joinedMessage = messageSplit.join(' ');
      var trelloURL = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$2");
      var clientInfo = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$5");

      if(!!trelloURL && (clientInfo !== trelloURL)){
        t.get("/1/cards/" + trelloURL, { }, function(errorURL, urlData) {
          if(!!urlData && !!urlData.id){
            var reproduction = "Can't reproduce.";
            bot.getMessages(channelID).then((data) => {
              var dataFinder = data.find(function(foundObj) {
                return foundObj.author.id === config.botID && foundObj.content.indexOf('https://trello.com/c/' + trelloURL) > -1;
              });
              var editMsgCreate = dataFinder.content + "\n❌ " + userTag;
              if(clientInfo === trelloURL){
                repro(clientInfo, reproduction, channelID, trelloURL, userID, userTag, dataFinder.id, editMsgCreate, msg.id);
              }else{
                repro(clientInfo, reproduction, channelID, trelloURL, userID, userTag, dataFinder.id, editMsgCreate, msg.id);
              }
            });
          }else{
            bot.createMessage(channelID, "<@" + userID + ">, incorrect url").then(delay(config.delayInMS)).then((innerMsg) => {
              bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
              bot.deleteMessage(channelID, msg.id);
            });
          }
        });
      }else{
        bot.createMessage(channelID, "<@" + userID + ">, please provide a valid URL and a client version").then(delay(config.delayInMS)).then((innerMsg) => {
          bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
          bot.deleteMessage(channelID, msg.id);
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

        var trelloURL = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?(\s\|(?:\s)?(.*))?/gi, "$2");
        var attachmentUrl = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?(\s\|(?:\s)?(.*))?/gi, "$6");
        t.get("/1/cards/" + trelloURL, { }, function(errorURL, urlData) {
          if(!!urlData && !!urlData.id){
            if(!!msg.attachments[0]){
              attachment = msg.attachments[0].url;
              addAttachment(channelID, attachment, trelloURL, userID, trelloURL, urlData.name, userTag);
            }else if(!!attachmentUrl.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig)){
              attachment = attachmentUrl;
              addAttachment(channelID, attachment, trelloURL, userID, trelloURL, urlData.name, userTag);
            }else{
              bot.createMessage(channelID, "<@" + userID + "> Please include a valid image").then(delay(config.delayInMS)).then((innerMsg) => {
                bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                bot.deleteMessage(channelID, msg.id);
              });
            }

          }else{
            bot.createMessage(channelID, "<@" + userID + "> Please include a valid trello link").then(delay(config.delayInMS)).then((innerMsg) => {
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
    } // Add attachments to reports // Attach files to existing reports
    if(command.toLowerCase() === "!edit"){
        var dev = msg.member.roles.indexOf(config.devRole);
        var hunter = msg.member.roles.indexOf(config.hunterRole);
        var admin = msg.member.roles.indexOf(config.adminRole);

        if(dev > -1 || hunter > -1 || admin > -1){
          var attachment;

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
                    if(!!urlData && !!urlData.id){
                      var attachment;

                      var section2 = report.match(/(steps to reproduce)([\s\S]*)(?=expected result)/gi);
                      var section3 = report.match(/(expected result)([\s\S]*)(?=actual result)/gi);

                      var systemClient = lowerCaseReport.match(/\b(?:system setting)|\b(?:client version)/gi);

                      if(!!systemClient && systemClient.length === 1 && systemClient.indexOf('system setting') > -1) {
                        var section4 = report.match(/(actual result)([\s\S]*)(?=system setting)/gi);
                        var section5 = report.match(/(system setting)([\s\S]*)/gi);

                        var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                        var section5Clean = section5[0].replace(/(System Setting(s)?(:)?)([\s\S]*)/gi, '$4');
                        var combinedSections = section4Clean + "\n####System settings:\n" + section5Clean;
                      }else if(!!systemClient && systemClient.length === 1 && systemClient.indexOf('client version') > -1) {
                        var section4 = report.match(/(actual result)([\s\S]*)(?=client version)/gi);
                        var section5 = report.match(/(client version)([\s\S]*)/gi);

                        var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                        var section5Clean = section5[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                        var combinedSections = section4Clean + "\n####Client version:\n" + section5Clean;
                      }else if(!!systemClient && systemClient.length === 2){

                        var section4 = report.match(/(actual result)([\s\S]*)(?=client version)/gi);
                        var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');

                        if(systemClient[0] === "client version"){
                          var section5 = report.match(/(client version)([\s\S]*)(?=system setting)/gi);
                          var section5Clean = section5[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                          var section6 = report.match(/(system setting)([\s\S]*)/gi);
                          var section6Clean = section6[0].replace(/(system setting(s)?(:)?)([\s\S]*)/gi, '$4');
                        }else{
                          var section5 = report.match(/(system setting)([\s\S]*)(?=client version)/gi);
                          var section5Clean = section5[0].replace(/(system setting(s)?(:)?)([\s\S]*)/gi, '$4');
                          var section6 = report.match(/(client version)([\s\S]*)/gi);
                          var section6Clean = section6[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                        }
                        var combinedSections = section4Clean + "\n####System settings:\n" + section5Clean + "\n####Client version:\n" + section6Clean;
                      }else{
                        var section4 = report.match(/(actual result)([\s\S]*)/gi);
                        var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                        var combinedSections = section4Clean;
                      }

                      var section2Clean = section2[0].replace(/(steps to reproduce(s)?(:)?)([\s\S]*)/gi, '$4');
                      var section3Clean = section3[0].replace(/(expected result(s)?(:)?)([\s\S]*)/gi, '$4');

                      if(!section2){
                        section2.push(' ');
                      }else if(!section3){
                        section3.push(' ');
                      }else if(!section4){
                        section4.push(' ');
                      }

                      if(section2[0].indexOf(' - ') > -1){
                        var section2String = section2Clean.replace(/(-)\s/g, '\n$&'); // give new lines to the list
                        if(!section2String){
                          section2String.push(' ');
                        }
                        const reportString = "Reported by " + userTag + '\n\n####Steps to reproduce:' + section2String + '\n\n####Expected result:\n' + section3Clean + '\n####Actual result:\n' + combinedSections;
                        if(!!msg.attachments[0]){
                          attachment = msg.attachments[0].url;
                        }else{
                          attachment = undefined;
                        }
                        updateTrelloCard(trelloURL, attachment, channelID, reportString, '<@' + userID + '>', userTag);
                      }else{
                        bot.createMessage(channelID, "<@" + userID + "> Please format the reproduction steps correctly ` - step one - step two - step three (etc)`").then(delay(config.delayInMS)).then((innerMsg) => {
                          bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                        });
                      }

                    }else{
                      bot.createMessage(channelID, "<@" + userID + "> I can’t find that issue in Trello. Please double check the URL.").then(delay(config.delayInMS)).then((innerMsg) => {
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

    if(command.toLowerCase() === "!submit"){ // Submit a report
      var dev = msg.member.roles.indexOf(config.devRole);
      var hunter = msg.member.roles.indexOf(config.hunterRole);
      var admin = msg.member.roles.indexOf(config.adminRole);

      if(dev > -1 || hunter > -1 || admin > -1){
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

                var attachment;

                var section2 = report.match(/(steps to reproduce)([\s\S]*)(?=expected result)/gi);
                var section3 = report.match(/(expected result)([\s\S]*)(?=actual result)/gi);

                var systemClient = lowerCaseReport.match(/\b(?:system setting)|\b(?:client version)/gi);

                if(!!systemClient && systemClient.length === 1 && systemClient.indexOf('system setting') > -1){
                  var section4 = report.match(/(actual result)([\s\S]*)(?=system setting)/gi);
                  var section5 = report.match(/(system setting)([\s\S]*)/gi);

                  var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                  var section5Clean = section5[0].replace(/(System Setting(s)?(:)?)([\s\S]*)/gi, '$4');
                  var combinedSections = section4Clean + "\n####System settings:\n" + section5Clean;
                  var repostCombinedSections = section4Clean + "\n**System settings:**" + section5Clean;
                }else if(!!systemClient && systemClient.length === 1 && systemClient.indexOf('client version') > -1){
                  var section4 = report.match(/(actual result)([\s\S]*)(?=client version)/gi);
                  var section5 = report.match(/(client version)([\s\S]*)/gi);

                  var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                  var section5Clean = section5[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                  var combinedSections = section4Clean + "\n####Client version:\n" + section5Clean;
                  var repostCombinedSections = section4Clean + "\n**Client version:**" + section5Clean;
                }else if(!!systemClient && systemClient.length === 2){

                  var section4 = report.match(/(actual result)([\s\S]*)(?=client version)/gi);
                  var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');

                  if(systemClient[0] === "client version"){
                    var section5 = report.match(/(client version)([\s\S]*)(?=system setting)/gi);
                    var section5Clean = section5[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                    var section6 = report.match(/(system setting)([\s\S]*)/gi);
                    var section6Clean = section6[0].replace(/(system setting(s)?(:)?)([\s\S]*)/gi, '$4');
                  }else{
                    var section5 = report.match(/(system setting)([\s\S]*)(?=client version)/gi);
                    var section5Clean = section5[0].replace(/(system setting(s)?(:)?)([\s\S]*)/gi, '$4');
                    var section6 = report.match(/(client version)([\s\S]*)/gi);
                    var section6Clean = section6[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                  }
                  var combinedSections = section4Clean + "\n####System settings:\n" + section5Clean + "\n####Client version:\n" + section6Clean;
                  var repostCombinedSections = section4Clean + "\n**System settings:**" + section5Clean + "\n**Client version:**" + section6Clean;
                }else{
                  var section4 = report.match(/(actual result)([\s\S]*)/gi);

                  var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');

                  var combinedSections = section4Clean;
                  var repostCombinedSections = section4Clean;
                }

                var section2Clean = section2[0].replace(/(steps to reproduce(s)?(:)?)([\s\S]*)/gi, '$4');
                var section3Clean = section3[0].replace(/(expected result(s)?(:)?)([\s\S]*)/gi, '$4');

                if(!section2){
                  section2.push(' ');
                }else if(!section3){
                  section3.push(' ');
                }else if(!section4){
                  section4.push(' ');
                }

                if(section2[0].indexOf(' - ') > -1){

                  var section2String = section2Clean.replace(/(-)\s/g, '\n$&'); // give new lines to the list

                  if(!section2String){
                    section2String.push(' ');
                  }

                  const reportStringSubmit = "Reported by " + userTag + '\n\n####Steps to reproduce:' + section2String + '\n\n####Expected result:\n' + section3Clean + '\n####Actual result:\n' + combinedSections;
                  const repostReportString = "Reported by " + userTag + "\n**Short description:** " + header + "\n**Steps to reproduce:** " + section2String + "\n**Expected result:** " + section3Clean + "\n**Actual result:** " + repostCombinedSections;
                  var cleanRepostReport = repostReportString.replace(/((http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)\.(?:jpg|gif|png))/gim, "");

                  if(!!msg.attachments[0]){
                    attachment = msg.attachments[0].url;
                  }else{
                    attachment = undefined;
                  }

                  if(channelID === config.iosChannel){
                    var listID = config.iosCard;
                    sendToTrello(listID, header, reportStringSubmit, channelID, attachment, "iOS", userTag, cleanRepostReport, msg.id);
                  }else if(channelID === config.androidChannel){
                    var listID = config.androidCard;
                    sendToTrello(listID, header, reportStringSubmit, channelID, attachment, "Android", userTag, cleanRepostReport, msg.id);
                  }else if(channelID === config.canaryChannel){
                    var listID = config.canaryCard;
                    sendToTrello(listID, header, reportStringSubmit, channelID, attachment, "Canary", userTag, cleanRepostReport, msg.id);
                  }
                }else{
                  bot.createMessage(channelID, "<@" + userID + "> Please format the reproduction steps correctly ` - step one - step two - step three (etc)`").then(delay(config.delayInMS)).then((innerMsg) => {
                    bot.deleteMessage(innerMsg.channel.id, innerMsg.id);
                  });
                }
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
    }
  }
});

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
      });
    }else{
      bot.createMessage(channelID, "<@" + userID + ">, your note has been added to the ticket.").then(delay(config.delayInMS)).then((msg_id) => {
        bot.deleteMessage(msg_id.channel.id, msg_id.id);
        bot.deleteMessage(channelID, msgID);
      });
      if(!!editMsgID && !!editMsgContent){
        bot.editMessage(channelID, editMsgID, editMsgContent);
        bot.createMessage(config.modLogChannel, "**" + userTag + "**: " + reproduction + " `" + info.data.card.name + "` <http://trello.com/c/" + info.data.card.shortLink + ">");
      }else{
        bot.createMessage(config.modLogChannel, "**" + userTag + "**: Added a note to `" + info.data.card.name + "` <http://trello.com/c/" + info.data.card.shortLink + ">");
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
      });
    }else{
      bot.createMessage(channelID, "<@" + userID + ">, your attachment has been added.").then(delay(config.delayInMS)).then((msg_id) => {
        bot.deleteMessage(msg_id.channel.id, msg_id.id);
      });
      bot.createMessage(config.modLogChannel, "**" + userTag + "** added an attachment to `" + urlDateName + "` <https://trello.com/c/" + trelloURL + ">");
    }
  }
  var addAttachment = {
    url: attachment,
    name: userTag
  }
  t.post('/1/cards/' + cardID + '/attachments', addAttachment, attachmentAdded);

}
function sendToTrello(listID, header, report, channelID, attachment, whereFrom, userTag, repostReportString, msgID){
  var creationSuccess = function(creationSuccessErr, data) {
    if(!!creationSuccessErr){
      console.log(creationSuccessErr);
    }
    if(!!attachment){
      var attachmentAdded = function(attachmentAddedErr, dataAttachment){
        if(!!attachmentAddedErr){
          console.log(attachmentAddedErr);
        }
        bot.createMessage(channelID, repostReportString + "\n<" + data.shortUrl + ">\n\n**Reproducibility:**").then(delay(config.delayInMS)).then(() => {
          bot.deleteMessage(channelID, msgID);
        });
        bot.createMessage(config.modLogChannel, whereFrom + ": **" + userTag + "** submitted this report `" + header + "` <" + data.shortUrl + ">");
      }
      var addAttachment = {
        url: attachment,
        name: userTag
      }
      t.post('/1/cards/' + data.id + '/attachments', addAttachment, attachmentAdded);
    }else{
      bot.createMessage(channelID, repostReportString + "\n<" + data.shortUrl + ">\n\n**Reproducibility:**").then(delay(config.delayInMS)).then(() => {
        bot.deleteMessage(channelID, msgID);
      });
      bot.createMessage(config.modLogChannel, whereFrom + ": **" + userTag + "** submitted this report `" + header + "` <" + data.shortUrl + ">");
    }
  };
  var newCard = {
    name: header,
    desc: report,
    idList: listID,
    pos: 'top'
  };
  t.post('/1/cards/', newCard, creationSuccess);
}
function updateTrelloCard(cardID, attachment, channelID, report, userID, userTag){
  var cardUpdated = function(error, data){
    if(!!attachment){
      var attachmentAdded = function(attachmentAddedErr, dataAttachment){
        if(!!attachmentAddedErr){
          console.log(attachmentAddedErr);
        }
        bot.createMessage(channelID, userID + ", the Bug Report at <" + data.shortUrl + "> has been successfully updated.");
        bot.createMessage(config.modLogChannel, "**" + userTag + "** edited this report `" + data.name + "` <" + data.shortUrl + ">");
      }
      var addAttachment = {
        url: attachment,
        name: userTag
      }
      t.post('/1/cards/' + data.id + '/attachments', addAttachment, attachmentAdded);
    }else{
      bot.createMessage(channelID, userID + ", the Bug Report at <" + data.shortUrl + "> has been successfully updated.");
      bot.createMessage(config.modLogChannel, "**" + userTag + "** edited this report `"  + data.name + "` <" + data.shortUrl + ">");
    }
  }
  var updateCard = {
    value: report
  }
  t.put('/1/cards/' + cardID + '/desc', updateCard, cardUpdated);
}
bot.connect();
