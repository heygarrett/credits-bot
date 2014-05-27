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
    channels: ["#learnprogramming,#lpmc"],
    server: "irc.freenode.net",
    botName: "credits-bot"
};

var irc = require('irc');

var bot = new irc.Client(config.server, config.botName, {
    channels: config.channels,
    userName: config.botName
});

var nr = require('newrelic');
var redis = require('redis');
var url = require('url');
var redisURL = url.parse(process.env.REDISCLOUD_URL);
var client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
client.auth(redisURL.auth.split(":")[1]);
var Leaderboard = require('leaderboard');
var plus_lb = new Leaderboard('pluses', {}, client);

var users = [];

bot.addListener("message", function(nick, to, text, message) {
    var words = text.replace(/[^\w\d-+]/, "").split(" ");
    var re = /^[\w\d-]*\+(\d+)$/gm;
    var numCredits;
    if (re.test(words[0])) {
        numCredits = parseInt(words[0].match(re)[0].replace(/[^\d]*/, ""));
    }
    var plusReceiver;
    if (typeof numCredits === 'number') {
        for (var i = users.length - 1; i >= 0; --i) {
            if (words[0].indexOf(users[i]) === 0) {
                plusReceiver = users[i];
                break;
            }
        }
    }
    if (typeof plusReceiver !== 'undefined') {
        console.log(numCredits);
        plus_lb.score(nick, function(err, score) {
            console.log(numCredits);
            if (score - numCredits >= 0) {
                plus_lb.incr(plusReceiver, numCredits);
                plus_lb.incr(nick, -numCredits);
                bot.say(to, "Credits transferred from " + nick + " to " + plusReceiver + ": " + numCredits);
            } else {
                bot.say(to, nick + " sorry, but you don't have enough credits.");
            }
        });
    }
    if (words[0].indexOf(config.botName) === 0 && words[1].indexOf("help") >= 0) {
         bot.say(to, "\"<nick>+X\" will give X credits to <nick>. \"/notice credits-bot credits\" will show you how many credits you have.");
    }
});

bot.addListener("join", function(channel, who) {
    users.push(who);
    plus_lb.add(who, 15);
});

bot.addListener("part", function (channel, nick, reason, message) {
    var index = users.indexOf(nick);
    if (index > -1) {
        users.splice(index, 1);
    }
});

bot.addListener("quit", function (nick, reason, channels, message) {
    var index = users.indexOf(nick);
    if (index > -1) {
        users.splice(index, 1);
    }
});

bot.addListener("kick", function (channel, nick, by, reason, message) {
    var index = users.indexOf(nick);
    if (index > -1) {
        users.splice(index, 1);
    }
    bot.say(channel, by + ": We thank you for your service.");
});

bot.addListener("kill", function (nick, reason, channels, message) {
    var index = users.indexOf(nick);
    if (index > -1) {
        users.splice(index, 1);
    }
});

bot.addListener("names", function(channel, nicks) {
    users = Object.keys(nicks);
    console.log(users);
    plus_lb.list(function(err, list) {
        console.log(list);
        for (var i = users.length - 1; i >= 0; --i) {
            for (var j = list.length -1; j >= 0; --j) {
                if (list[j].member === users[i]) {
                    break;
                } else if (j === 0) {
                    plus_lb.add(users[i], 15);
                    console.log(users[i] + " was given 15 credits.");
                }
            }
        }
    });
});

bot.addListener("nick", function(oldnick, newnick, channels, message) {
    plus_lb.score(newnick, function(err, score) {
        if (score === -1) {
            plus_lb.add(newnick, 15);
        } 
    });
    users.push(newnick);
    var index = users.indexOf(oldnick);
    if (index > -1) {
        users.splice(index, 1);
    }
});

bot.addListener("notice", function(nick, to, text, message) {
    if (/credits/.test(text)) {
        plus_lb.score(nick, function(err, score) {
            bot.notice(nick, score.toString());
        });
    }
});
