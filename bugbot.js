"use strict";
const Eris = require('eris');
const config = require('./config');
const customConfig = require('./configEdit');
const commandList = require('./src/commandList')();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data/data.sqlite');
const utils = require("./src/utils");
const modUtils = require('./src/modUtils');
const backup = require('./src/backup');
const dateFormat = require('dateformat');
const fs = require('fs');

let Trello = require('node-trello');
var trello = new Trello(customConfig.trelloKey, customConfig.trelloToken);

let bot = new Eris(customConfig.botToken, {
  getAllUsers: true
});

bot.on('error', err => {
  let newDate = new Date();
  let currentTime = dateFormat(newDate, "UTC:mm-dd-yyyy-HH-MM");
  console.log("BOT ERROR:\n" + err.stack);
});
let reconnect = false;
bot.on("ready", () => {
  console.log('───────────────────────\nReady! PID: ' + process.pid);
  db.run("CREATE TABLE IF NOT EXISTS reports (id INTEGER, header TEXT, reportString TEXT, userID TEXT, userTag TEXT, cardID TEXT, reportStatus TEXT, trelloURL TEXT, canRepro INTEGER, cantRepro INTEGER, reportMsgID TEXT, timestamp TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS reportQueueInfo (id INTEGER, userID TEXT, userTag TEXT, info TEXT, stance TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS reportAttachments (id INTEGER, userID TEXT, userTag TEXT, attachment TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS users (userID TEXT, xp INTEGER, windows TEXT, ios TEXT, android TEXT, macOS TEXT, linux TEXT, reproDailyNumb INTEGER, ADdailyNumb INTEGER, hugDailyNumb INTEGER, trackReport BOOLEAN)");
  bot.createMessage(config.channels.modLogChannel, "I heard there are bugs that needs reporting. I'm online and ready to rumble!");

  if(reconnect === false) {
    //run loops
    backup(bot);
    reconnect = true;
  }
});

commandList.add('addNote');
commandList.add('addRoles');
commandList.add('adminCommands');
commandList.add('approveDeny');
commandList.add('attachment');
commandList.add('edit');
commandList.add('modCommands');
commandList.add('how_I_Learned_To_Stop_Worrying_And_Love_bot_Commands');
commandList.add('reproductions');
commandList.add('revoke');
commandList.add('storeInfo');
commandList.add('submit');

function userHasRole(user, role) {
  return user.roles.some(memberRole => memberRole === role);
}

function userHasAuthorityForCommand(user, command) {
  if(command.roles.some(role => role == config.roles.everybodyRole)) {
    return true;
  }

  return command.roles.some(role => userHasRole(user, role));
}

function correctChannel(guildChannel, channel){
  return guildChannel.id === channel;
}

function correctChannelIsBeingUsed(guild, command) {
  if(command.channels.some(channel => channel === config.channels.allChannels)){
    return true;
  }
  return command.channels.some(channel => correctChannel(guild, channel));
}

function checkIfDM(command) {
  if(command.acceptFromDM === true) {
    return true;
  }
}

let delMsgCooldown = false;

bot.on('messageCreate', (msg) => {
  let messageSplit = msg.content.split(' ');
  let command = messageSplit.shift();
  if(!!msg.channel.guild && msg.channel.guild.id !== config.DTserverID) {
    return;
  }

  let userTag = msg.author.username + "#" + msg.author.discriminator;
  let userID = msg.author.id;
  let channelID = msg.channel.id;
  let thisMember = msg.member;

  if(!msg.channel.guild) {
    let getGuild = bot.guilds.get(config.DTserverID);
    let getMember = getGuild.members.get((msg.author.id));
        thisMember = getMember;
  }

  if(command.match(/^!/)) {

    let matchingCommand = commandList.find(command);

    if(!msg.channel.guild && matchingCommand.acceptFromDM !== true) {
      return;
    }

    //check for roles
    if(userHasAuthorityForCommand(thisMember, matchingCommand)) {
      //check for channel
      if(correctChannelIsBeingUsed(msg.channel, matchingCommand)){
        if(!userTag) {
          let thisDate = new Date();
          let cTime = dateFormat(thisDate, "UTC:mm-dd-yyyy-HH-MM");
          console.log(`${cTime}\n${userTag} ${command}`);
        }

        matchingCommand.execute(bot, channelID, userTag, userID, command, msg, trello, db);
      } else {
        //Tell the user they're posting the command in the wrong channel?
      }
    }else {
      // Add channel check
      //Tell the user they don't have permission for that command
      utils.botReply(bot, userID, channelID, "you do not have access to that command", command, msg.id, true);
    }
  }else {
    if(!!msg.channel.guild) {
      let isRightChannel = channelID === config.channels.queueChannel || channelID === config.channels.iosChannel || channelID === config.channels.linuxChannel || channelID === config.channels.androidChannel || channelID === config.channels.canaryChannel;
      let isNotMod = msg.member.roles.indexOf(config.roles.devRole) && msg.member.roles.indexOf(config.roles.adminRole) && msg.member.roles.indexOf(config.roles.trelloModRole);
      let isNotBot = userID !== config.botID;

      if(isNotBot && isNotMod === -1 && isRightChannel) {
        //Delete and say commands only on delay
        bot.deleteMessage(channelID, msg.id);
        if(delMsgCooldown === false){
          delMsgInReportingChannel(channelID, userID);
        }
      }
    } else {
      if(thisMember.roles.indexOf(config.roles.initiateRole) !== -1 && thisMember.roles.indexOf(config.roles.hunterRole) === -1) {
        if(msg.content.toLowerCase() === customConfig.secretPhrase) {
          let getHunterRole = thisMember.roles;
          let indexOfInitiateRole = getHunterRole.indexOf(config.roles.initiateRole);
          getHunterRole.splice(indexOfInitiateRole, 1);
          getHunterRole.push(config.roles.hunterRole);
          bot.editGuildMember(config.DTserverID, userID, {
            roles: getHunterRole
          }).then(() => {
            bot.getMessages(config.channels.charterChannel).then((allMsgs) => {
              let thisMsg = allMsgs.find(function(msgs) {
                return msgs.author.id === config.botID && msgs.content.indexOf(`<@${userID}>`) > -1;
              });
              if(!!thisMsg) {
                bot.deleteMessage(config.channels.charterChannel, thisMsg.id).catch(() => {});
              }
            });

            bot.createMessage(config.channels.bugHunterChannel, `Welcome <@${userID}> to the Bug Hunters:tm:!`);
            bot.createMessage(config.channels.modLogChannel, `<:evilDabbit:233327051686412288> **${userTag}** just did the do and became a Bug Hunter:tm:!`);
          });
        }
      }
    }
  }
});

// Tell the user that they can only post commands in the reporting channel
function delMsgInReportingChannel(channelID, userID) {
  bot.createMessage(channelID, "<@" + userID + "> only bot-commands are allowed in this channel. Please review #bot-help if you're unsure of the commands.").then(utils.delay(customConfig.delayInS)).then((msgInfo) => {
    bot.deleteMessage(channelID, msgInfo.id);
  }); // Needs text for user reply when chatting in bug reporting channel
  delMsgCooldown = true;
  setTimeout(function () {
    delMsgCooldown = false;
  }, 8000);
}

bot.connect();
