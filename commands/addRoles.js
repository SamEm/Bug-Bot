"use strict";
const config = require("../config");
const customConfig = require('../configEdit');
const utils = require("../src/utils");

let addRoles = {
  pattern: /!ios|!android|!linux|!windows|!mac|!canary/i,
  execute: function(bot, channelID, userTag, userID, command, msg) {
    let allRoles = msg.member.roles;
    let cn = command.toLowerCase();
    let roleID;
    let roleName;

    switch (command.toLowerCase()) {
      case '!android':
        roleID = config.roles.androidAlphaRole;
        roleName = ':robot: `Android Alpha`';
        break;
      case '!ios':
        roleID = config.roles.iosTestflightRole;
        roleName = ':iphone: `iOS Test Flight`'
        break;
      case '!linux':
        roleID = config.roles.linuxTesterRole;
        roleName = ':penguin: `Linux Tester`';
        break;
      case '!windows':
        roleID = config.roles.windowsRole;
        roleName = '`Windows`';
        break;
      case '!mac':
        roleID = config.roles.macRole;
        roleName = '`Mac`';
        break;
      case '!canary':
        roleID = config.roles.canaryRole;
        roleName = '`Canary`';
        break;
    }

    let index = allRoles.indexOf(roleID);
    if (index === -1) {
      allRoles.push(roleID);
      bot.editGuildMember(msg.channel.guild.id, userID, {
        roles: allRoles
      }).then(() => {
        utils.botReply(bot, userID, channelID, `You gave yourself the role ${roleName}. Use the same command again to remove the role from yourself.`, command, msg.id);
        bot.createMessage(config.channels.modLogChannel, `${roleName} added to ${userTag}`);
      }).catch((err) => {
        console.log('--> addRole | uID: ' + userID + " rID: " + roleID + "\n" + err);
      });
    } else {
      allRoles.splice(index, 1);
      bot.editGuildMember(msg.channel.guild.id, userID, {
        roles: allRoles
      }).then(() => {
        utils.botReply(bot, userID, channelID, `You removed ${roleName} from yourself. Use the same command again to add the role to yourself.`, command, msg.id);
        bot.createMessage(config.channels.modLogChannel, `${roleName} removed from ${userTag}`);
      }).catch((err) => {
        console.log('--> removeRole | uID: ' + userID + " rID: " + roleID + "\n" + err);
      });
    }
  },
  roles: [
    config.roles.everybodyRole
    ],
  channels: [
    config.channels.allChannels
  ],
  acceptFromDM: false
}
module.exports = addRoles;
