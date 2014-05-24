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
    botName: "plusbot"
};

var irc = require('irc');

var bot = new irc.Client(config.server, config.botName, {
    channels: config.channels
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
    var words = text.replace(new RegExp("[^a-zA-Z0-9-_+ ()]", "gi"), "").split(" ");
        plusReceiver = "";

    for (var i = users.length - 1; i >= 0; --i) {
        if (words[0] === users[i] + "++") {
            plusReceiver = users[i];
            break;
        } else if (words[0] === "karma(" + users[i] + ")") {
            userKarma(users[i], to);
            break;
        } else if (words[0] === "karma()") {
            leaderboard(to);
            break;
        }
    }

    if (plusReceiver !== "") {
        plus_lb.list(function(err, list) {
            var leaders = [];
            for (var i = list.length - 1; i >= 0; --i) {
                leaders.push(list[i].member);
            }

            if (leaders.indexOf(plusReceiver) === -1) {
                plus_lb.add(plusReceiver, 1);
            } else {
                plus_lb.incr(plusReceiver, 1);
            }

            if (plusReceiver === nick) {
                plus_lb.incr(plusReceiver, -2);
                plus_lb.score(plusReceiver, function(err, score) {
                    bot.say(to, nick + ": You get a downvote for cheating! " + nick + " now has " + score.toString() + " karma.");
                });
            } else {
                plus_lb.score(plusReceiver, function(err, score) {
                    bot.say(to, plusReceiver + " got an upvote! " + plusReceiver + " now has " + score.toString() + " karma.");
                });
            }
        });
    } 
});

function userKarma(nick, channel) {
    plus_lb.list(function(err, list) {
        for (var i = list.length -1; i >= 0; --i) {
            if (list[i].member === nick) {
                bot.say(channel, nick + " has " + list[i].score.toString() + " karma!");
                break;
            } else {
                bot.say(channel, nick + " has not received any karma!");
                break;
            }
        }
    });
}

function leaderboard(channel) {
    plus_lb.list(function(err, list) {
        if (list.length > 0) {
            var leaders = list[0].member + ": " + list[0].score;
            for (var i = 1; i < list.length; i++) {
                leaders = leaders + ", " + list[i].member + ": " + list[i].score;
            }
            bot.say(channel, leaders);
        } else {
            bot.say(channel, "No upvotes given yet!");
        }
    });
}

bot.addListener("join", function(channel, who) {
    bot.send("names", channel);
});

bot.addListener("names", function(channel, nicks) {
    users = Object.keys(nicks);
});

bot.addListener("nick", function(oldnick, newnick, channels, message) {
    plus_lb.list(function(err, list) {
        var newScore;
        for (var i = list.length - 1; i >= 0; --i) {
            if (list[i].member === oldnick) {
                newScore = list[i].score;
                break;
            }
        }
        plus_lb.add(newnick, newScore);
        plus_lb.rm(oldnick);
    });
});
