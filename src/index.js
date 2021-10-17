const Discord = require("discord.js");
const Client = new Discord.Client({ 
    intents: [ 
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES
  ]
 });

 const Config = require("../config.js");

// Connect to discord bot

Client.on('ready', readybot);
Client.on('messageCreate', getMessages);
Client.login(Config.DISCORD_BOT_TOKEN);

function readybot() {
    console.log ('FSaver is online.');
}

// Register a handler for MessageCreated event

function getMessages(message) {
    if (message.content == "run fsaver") {
        let channel = message.channel;
        let manager = message.channel.messages;
        manager.fetch({limit: 100}).then(result => {
            result = result.filter(msg => msg.content.startsWith("fsave"));
            channel.send("**Query results for fsave:**\n")
            result.each(msg => channel.send("• " + msg.content.slice(6)));
        });
    }
}
