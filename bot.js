var express = require("express");
var logfmt = require("logfmt");
var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
  res.send('Hello World!');
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

var config = {
    channels: ["#chat"],
    server: "mccs.stu.marist.edu",
    botName: "nodebot"
};

var irc = require("irc");

var bot = new irc.Client(config.server, config.botName, {
    channels: config.channels
});

var channelNicks = [];

bot.addListener("join", function(channel, who) {
    console.log(who + " joined the server.");
});

bot.addListener("message", function(nick, to, text, message) {
    console.log(nick + " => " + text);

    var messageList = text.replace(new RegExp("[^a-zA-Z ]", "gi"), "").toLowerCase().split(" ");

    if (new RegExp("pon(?=/y|ies/", "gi").test(text) {
        bot.say(to, "OMG PONIES!!");

    if (text.indexOf("nodebot") == 0) {
        bot.say(to, "Sorry " + nick + ", but I don't do anything yet.");
    }
});

bot.addListener("quit", function (nick, reason, channels, message) {
    console.log(nick + " quit the server.");
});
