var config = {
    channels: ["#chat"],
    server: "mccs.stu.marist.edu",
    botName: "nodebot"
};

var port = process.env.PORT || 5000;

var irc = require("irc");

var bot = new irc.Client(config.server, config.botName, {
    channels: config.channels
});

bot.addListener("join", function(channel, who) {
	bot.say(channel, who + "...dude...welcome back!");
});

bot.addListener("message", function(nick, to, text, message) {
    if (text.indexOf("nodebot") == 0) {
        bot.say(to, "Sorry " + nick + ", but I don't do anything yet.");
    }
});
