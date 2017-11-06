var fs = require("fs");
var express = require("express");

var style = require("hsl-map-style").generateStyle({
    glyphsUrl: "http://kartat.hsl.fi/",
    components: {
        text_fisv: { enabled: true },
        routes: { enabled: true },
        stops: { enabled: true },
        citybikes: { enabled: true },
        icons: { enabled: true },
        print: { enabled: false },
        municipal_borders: { enabled: true },
    }
});

var app = express();

app.get("/", function (req, res) {
    res.set("Content-Type", "text/html");
    var index = fs.readFileSync("index.html", "utf8");
    res.send(index);
});

app.get("/style.json", function (req, res) {
    res.set("Content-Type", "application/json");
    res.send(style);
});

app.listen(3000, function () {
    console.log("Listening at localhost:3000");
});
