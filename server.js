const fs = require('fs')
const express = require('express')

const style = require('hsl-map-style').generateStyle({
    components: {
        text_fisv: { enabled: true },
        routes: { enabled: true },
        stops: { enabled: true },
        citybikes: { enabled: true },
        icons: { enabled: true },
        print: { enabled: false },
        municipal_borders: { enabled: true }
    }
})

const app = express()

app.get("/", function (req, res) {
    res.set("Content-Type", "text/html");
    const index = fs.readFileSync('index.html', 'utf8')
    res.send(index);
});

app.get("/index.js", function(req, res) {
    res.set("Content-Type", "application/javascript");
    const js = fs.readFileSync('index.js', 'utf8')
    
    const graphqlUrl = process.env.GRAPHQL_URL || 'https://kartat.hsl.fi/jore/graphql'
    const jsWithEnv = js.replace(/process.env.GRAPHQL_URL/g, `"${graphqlUrl}"`)
    
    res.send(jsWithEnv)
})

app.get("/style.json", function (req, res) {
    res.set("Content-Type", "application/json");
    res.send(style);
});

const port = process.env.PORT || 3000

app.listen(port, function () {
    console.log("Listening at localhost:3000");
});
