var config = {
  botToken : '',
  trelloKey: '',
  trelloToken: '',

  iosChannel: '202491590390841344',               //ios text Channel
  androidChannel: '232568032394870784',           //android text Channel
  canaryChannel: '197038744908333066',            //canary text Channel
  linuxChannel: '238073742624948225',             //linux text Channel
  modLogChannel: "241625778368806912",            //mod log text Channel
  bugHunterChannel: '217764019661045761',         //bug hunter text Channel
  bugApprovalChannel: '253923313460445184',       //bug approval text channel

  devRole: '197042389569765376',                  //dev role
  hunterRole: '197042209038663680',               //bug hunter role
  adminRole: '197042322939052032',                //admin role
  androidAlphaRole: '234838349800538112',         //android alpha role
  iosTestflightRole: '234838392464998402',        //ios testflight role
  trelloModRole: '197400761104203776',            //trello mod role

  iosCard: '57fd4af58042f56c271d46b3',            //ios user report card
  androidCard: '57f2a30d861fa9b5816c9717',        //android user report card
  canaryCard: '5771677fda45a436c5b8d255',         //canary user report card
  
  // ios labels
  iosP3Label: '57f2d33384e677fd36abfaf9',         // P3 - Probably will never get fixed.
  iosP2Label: '57f2d33384e677fd36abfafa',         // P2 - Can wait a while
  iosP1Label: '57f2d33384e677fd36abfafb',         // P1 - Severe
  iosP0Label: '57f2d33384e677fd36abfafe',         // P0 - Need an Immediate Fix
  iosNILabel: '57f2d33384e677fd36abfafc',         // Needs more info
  
  // android labels
  droidP3Label: '57f2a30684e677fd36ab30e4',       // P3 - Probably will never get fixed.
  droidP2Label: '57f2a30684e677fd36ab30e5',       // P2 - Can wait a while
  droidP1Label: '57f2a30684e677fd36ab30e6',       // P1 - Severe
  droidP0Label: '57f2a30684e677fd36ab30e7',       // P0 - Need an Immediate Fix
  droidNILabel: '585ad47084e677fd36d81642',       // Needs more info
  
  // canary labels
  canP3Label: '5771673884e677fd364b7221',         // P3 - Probably will never get fixed.
  canP2Label: '5771673884e677fd364b7222',         // P2 - Can wait a while
  canP1Label: '5771673884e677fd364b7223',         // P1 - Severe
  canP0Label: '5771673884e677fd364b7224',         // P0 - Need an Immediate Fix
  canNILabel: '5771673884e677fd364b7226',         // Needs more info
  
  // linux labels
  linuxP3Label: '5846f7fd84e677fd36a40d6f',       // P3 - Probably will never get fixed.
  linuxP2Label: '5846f7fd84e677fd36a40d70',       // P2 - Can wait a while
  linuxP1Label: '5846f7fd84e677fd36a40d71',       // P1 - Severe
  linuxP0Label: '5846f7fd84e677fd36a40d72',       // P0 - Need an Immediate Fix
  linuxNILabel: '5846f7fd84e677fd36a40d74',       // Needs more info

  botID: '240545475118235648',                    //bot's user ID
  DTserverID: '197038439483310086',               //Discord Testers srver ID
  delayInMS: 15000,                               //delay in ms for the bot to remove messages
  minuteDelay: 60000                              //one minute delay for bug queue
}
module.exports = config;
