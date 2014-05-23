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

var redis = require('redis');
    url = require('url');
    redisURL = url.parse(process.env.REDISCLOUD_URL);
    client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
    client.auth(redisURL.auth.split(":")[1]);
    Leaderboard = require('leaderboard');
    plus_lb = new Leaderboard('pluses');
    console.log("LOOK HERE AT THIS HERE URL THINGY");
    console.log(redisURL);

var users = [];

bot.addListener("message", function(nick, to, text, message) {
    if (text.indexOf("nodebot") === 0) {
       if (new RegExp("plus", "gi").test(text)) {
            var plusReceiver = "";
            for (var i = users.length - 1; i >= 0; --i) {
                if (new RegExp(users[i], "gi").test(text)) {
                    plusReceiver = users[i];
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

                    var grammar = "pluses";
                    if (plusReceiver === nick) {
                        plus_lb.incr(plusReceiver, -2);
                        plus_lb.score(plusReceiver, function(err, score) {
                            if (score === 1 || score === -1) {
                                grammar = "plus";
                            }
                            bot.say(to, nick + ": No cheating! 1 point from Gryffindor! You now have " + score.toString() + " " + grammar + ".");
                        });
                    } else {
                        plus_lb.score(plusReceiver, function(err, score) {
                            if (score === 1 || score === -1) {
                                grammar = "plus";
                            }
                            bot.say(to, plusReceiver + " got a plus! " + plusReceiver + " now has " + score.toString() + " " + grammar + ".");
                        });
                    }
                });
            }
        } else if (new RegExp("leaderboard", "gi").test(text)) {
            plus_lb.list(function(err, list) {
            var leaders = list[0].member + ": " + list[0].score;
                for (var i = 1; i < list.length; i++) {
                    leaders = leaders + ", " + list[i].member + ": " + list[i].score;
                }
            bot.say(to, leaders);
            });
        }
    }
});

bot.addListener("join", function(channel, who) {
    bot.send("names", channel);
});

bot.addListener("names", function(channel, nicks) {
    users = Object.keys(nicks);
});
