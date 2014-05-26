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
    redis = require('redis');
    url = require('url');
    redisURL = url.parse(process.env.REDISCLOUD_URL);
    client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
    client.auth(redisURL.auth.split(":")[1]);
    Leaderboard = require('leaderboard');
    plus_lb = new Leaderboard('pluses', {}, client);

var users = [];

bot.addListener("message", function(nick, to, text, message) {
    var words = text.replace(/[^a-zA-Z0-9-_+ ()]/, "").split(/[+ ]/);
    var numCredits;
    if (words[1]) {
        numCredits = parseInt(words[1].replace(/[^\d]/, ""));
    }
    for (var i = users.length - 1; i >= 0; --i) {
        if (words[0] === users[i] && numCredits === 'undefined') {
            var plusReceiver = users[i];
            plus_lb.score(nick, function(err, score) {
                if (score > 0) {
                    plus_lb.list(function(err, list) {
                        for (var i = list.length - 1; i >= 0; --i) {
                            if (nick === list[i].member) {
                                plus_lb.incr(plusReceiver, numCredits);
                                break;
                            } else {
                                plus_lb.add(plusReceiver, numCredits + 15);
                                break;
                            }
                        }
                    });
                    plus_lb.incr(nick, -numCredits);
                    plus_lb.score(plusReceiver, function(err, score) {
                        bot.say(to, nick + " gave " + plusReceiver + " a " + numCredits + " credits. Send a notice to credits-bot to check your credits.");
                    });
                } else {
                    bot.say(to, "Sorry " + nick + ", but you don't have any credits to give.");
                }
            });
            break;
        }   
    }

});

function leaderboard(channel) {
    plus_lb.list(function(err, list) {
        if (list.length > 0) {
            var leaders = "Top 10 => " + list[0].member + ": " + list[0].score;
            for (var i = 1; i < Math.min(list.length, 9); i++) {
                leaders = leaders + ", " + list[i].member + ": " + list[i].score;
            }
            bot.say(channel, leaders);
        } else {
            bot.say(channel, "No credits given yet!");
        }
    });
}

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
                    plus_lb.add(users[i], 5);
                    console.log(users[i]);
                }
            }
        }
    });
});

bot.addListener("nick", function(oldnick, newnick, channels, message) {
    plus_lb.list(function(err, list) {
        var isMerchant = false;
        for (var i = list.length -1; i >= 0; --i) {
            if (list[i].member === newnick) {
                isMerchant = false;
                break;
            }
            if (list[i].member === oldnick) {
                isMerchant = true;
            }
        }
        if (isMerchant === true) {
            plus_lb.score(oldnick, function(err, score) {
                plus_lb.add(newnick, score);
            });
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
