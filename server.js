const fs = require("fs")
const express = require("express")

const style = require("hsl-map-style").generateStyle({
  components: {
    text_fisv: {enabled: true},
    routes: {enabled: true},
    stops: {enabled: true},
    citybikes: {enabled: true},
    icons: {enabled: true},
    print: {enabled: false},
    municipal_borders: {enabled: true}
  }
})

const app = express()

app.get("/", function(req, res) {
  res.set("Content-Type", "text/html")
  const index = fs.readFileSync("index.html", "utf8")
  res.send(index)
})

app.get("/index.js", function(req, res) {
  res.set("Content-Type", "application/javascript")
  let js = fs.readFileSync("index.js", "utf8")

  for (const [name, value] of Object.entries(process.env)) {
    js = js.replace(new RegExp(`(\${)*(process\.env\.${name})(})*`, "gm"), `$1"${value}"$3`)
  }

  res.send(js)
})

app.get("/style.json", function(req, res) {
  res.set("Content-Type", "application/json")
  res.send(style)
})

const port = process.env.PORT || 3000

app.listen(port, function() {
  console.log("Listening at localhost:3000")
})
