// The env var will be replaced in the server.js file.
const GRAPHQL_URL = process.env.GRAPHQL_URL
const LINK_URL = process.env.LINK_URL
const DIGITRANSIT_URL = process.env.DIGITRANSIT_URL
const DIGITRANSIT_APIKEY = process.env.DIGITRANSIT_APIKEY

const ROUTE_QUERY = `
  query RouteQuery($direction:String!, $routeId: String!, $dateBegin: Date!, $dateEnd: Date!) {
    data: routeByRouteIdAndDirectionAndDateBeginAndDateEnd(
      routeId: $routeId,
      direction: $direction,
      dateBegin: $dateBegin,
      dateEnd: $dateEnd
    ) {
      destinationFi
      originFi
      line {
        nodes {
          lineId
          dateBegin
          dateEnd
        }
      }
    }
  }`

const STOP_QUERY = `
  query StopQuery($stopId:String!, $date: Date!) {
    data: stopByStopId(
      stopId: $stopId
    ) {
      routes: routeSegmentsForDate(date: $date){
        nodes {
          routeId
          dateBegin
          dateEnd
        }
      }
    }
  }`

const RAIL_ROUTE_ID_REGEXP = /^300[12]/
const SUBWAY_ROUTE_ID_REGEXP = /^31/

// The confidence level which the geocoding result have to get to show the result.
const GEOCODE_CONFIDENCE_LIMIT = 0.99

/**
 * Returns whether a route id is a so called number variant
 * @param {String} routeId - Route id
 * @returns {boolean}
 */
function isNumberVariant(routeId) {
  return /.{5}[0-9]/.test(routeId)
}

/**
 * Returns whether a route id is belongs to a rail route
 * @param {String} routeId - Route id
 * @returns {boolean}
 */
function isRailRoute(routeId) {
  return RAIL_ROUTE_ID_REGEXP.test(routeId)
}

/**
 * Returns whether a route id is belongs to a subway route
 * @param {String} routeId - Route id
 * @returns {boolean}
 */
function isSubwayRoute(routeId) {
  return SUBWAY_ROUTE_ID_REGEXP.test(routeId)
}

/**
 * Returns route id without area code or leading zeros
 * @param {String} routeId - Route id
 * @returns {String}
 */
function trimRouteId(routeId) {
  if (isRailRoute(routeId) && isNumberVariant(routeId)) {
    return routeId.substring(1, 5).replace(RAIL_ROUTE_ID_REGEXP, "")
  } else if (isRailRoute(routeId)) {
    return routeId.replace(RAIL_ROUTE_ID_REGEXP, "")
  } else if (isSubwayRoute(routeId) && isNumberVariant(routeId)) {
    return routeId.substring(1, 5).replace(SUBWAY_ROUTE_ID_REGEXP, "")
  } else if (isSubwayRoute(routeId)) {
    return routeId.replace(SUBWAY_ROUTE_ID_REGEXP, "")
  } else if (isNumberVariant(routeId)) {
    // Do not show number variants
    return routeId.substring(1, 5).replace(/^[0]+/g, "")
  }
  return routeId.substring(1).replace(/^[0]+/g, "")
}

function renderRoute(route) {
  const line = _.get(route, "line.nodes[0]")

  if (!line) {
    return
  }

  // The env var will be replaced in the server.js file.
  return `
    <div>
      <a href="${LINK_URL}/kuljettaja/map/?${line.lineId}[dateBegin]=${
    line.dateBegin
  }&${line.lineId}[dateEnd]=${line.dateEnd}">
        ${trimRouteId(route.routeId)} ${route.originFi} -> ${route.destinationFi}
      </a>
    </div>`
}

function renderStop(stop) {
  return `<div>${stop.nameFi} (${stop.shortId}) ${stop.routes.nodes
    .map((node) => trimRouteId(node.routeId))
    .join(" ")}</div>`
}

function renderFeature(feature) {
  return feature.routeId ? renderRoute(feature) : renderStop(feature)
}

function getFormattedDate() {
  var d = new Date(),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear()

  if (month.length < 2) month = "0" + month
  if (day.length < 2) day = "0" + day

  return [year, month, day].join("-")
}

function fetchData(feature) {
  feature.date = getFormattedDate()
  return fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      queryName: feature.routeId ? "RouteQuery" : "StopQuery",
      query: feature.routeId ? ROUTE_QUERY : STOP_QUERY,
      variables: feature
    })
  })
    .then((res) => res.json())
    .then((res) => Object.assign({}, feature, res.data.data))
}

const currentDate = moment().format("YYYY-MM-DD")
let map = new mapboxgl.Map({
  container: "map",
  center: [24.9384, 60.1699],
  style: `style.json/${currentDate}`,
  zoom: 10
})

var isFetching = false
setOnClickEvent()

function setOnClickEvent() {
  map.on("click", function(e) {
    if (isFetching) {
      return
    }

    const datepickerdiv = document.getElementById("datepicker").value
    moment.locale("fi")
    const momentDate = moment(datepickerdiv, "L") // L means locale format, removes the warning of non-ISO date format
    const point = e.point
    const sw = [point.x - 10, point.y + 10]
    const ne = [point.x + 10, point.y - 10]

    isFetching = true

    Promise.all(
      _.sortBy(
        _.uniqBy(
          map
            .queryRenderedFeatures([sw, ne])
            .filter((feature) => ["routes", "stops"].includes(feature.layer.source))
            .map((feature) => feature.properties),
          JSON.stringify
        ),
        ["stopId", "routeId", "direction"]
      ).map(fetchData)
    ).then((features) => {
      isFetching = false

      if (!features || features.length === 0) {
        return
      }

      const filteredFeatures = features.filter((feature) => {
        if (!momentDate.isValid()) {
          return true
        }
        const dateBegin = moment(feature.dateBegin)
        const dateEnd = moment(feature.dateEnd)
        return dateBegin.isBefore(momentDate) && dateEnd.isAfter(momentDate)
      })

      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(filteredFeatures.map(renderFeature).join(""))
        .addTo(map)
    })
  })
}

function SearchControl() {}

SearchControl.prototype.onAdd = function(map) {
  this._map = map
  this._container = document.createElement("div")
  this._container.innerHTML = `
      <div class='search-bar-container unselect'>
        <input placeholder='Hae' id='location-search'/>
        <div class='btn' onclick='search()'>Hae</div>
      </div>
    `
  return this._container
}

SearchControl.prototype.onRemove = function() {
  this._container.parentNode.removeChild(this._container)
  this._map = undefined
}

function DateControl() {}

DateControl.prototype.onAdd = function(map) {
  this._map = map
  this._container = document.createElement("div")
  this._container.innerHTML = `
    <div class='search-bar-container unselect'>
      <input readonly='true' placeholder='Päivämäärä' id='datepicker'></input>
      <div style="width:50px;" class='btn' onclick='emptyDate()'>Tyhjennä</div>
      <div style="width:50px;" class='btn' onclick='updateMap()' title="Päivittää kartan geometriat päivämäärän mukaan">Aseta</div>
    <div/>
    `
  return this._container
}

var markerList = []

function clearMarkers() {
  for (var i = 0; i < markerList.length; i++) {
    var marker = markerList[i]
    marker.remove()
  }
  markerList.length = 0
}

function checkConfidence(feature) {
  if (feature.properties && feature.properties.confidence) {
    return feature.properties.confidence >= GEOCODE_CONFIDENCE_LIMIT
  }
  return false
}

function searchCallback(res) {
  var result = JSON.parse(res)
  if (result.features && result.features.length && checkConfidence(result.features[0])) {
    var coordinates = result.features[0].geometry.coordinates
    // Place the exact result label to the search box
    document.getElementById("location-search").value = result.features[0].properties.label

    map.setCenter(coordinates)
    map.setZoom(15)

    clearMarkers()
    markerList.push(new mapboxgl.Marker().setLngLat(coordinates).addTo(map))
  } else {
    alert("Hakusi ei tuottanut tuloksia")
  }
}

map.addControl(new SearchControl(), "top-left")
map.addControl(new DateControl(), "top-left")
datepicker("#datepicker", {
  formatter: (input, date, instance) => {
    const value = Date.parse(date)
    const newDate = new Date(value)
    input.value = `${newDate.getDate()}.${newDate.getMonth() + 1}.${newDate.getFullYear()}`
  },
  startDay: 1,
  customDays: ["Su", "Ma", "Ti", "Ke", "To", "Pe", "La"]
})

function search() {
  var val = document.getElementById("location-search").value
  if (val && val.length > 1) {
    var xmlHttp = new XMLHttpRequest()
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
        searchCallback(xmlHttp.responseText)
    }
    var currentCenter = map.getCenter()
    var url =
      `${DIGITRANSIT_URL}/geocoding/v1/search?text=` +
      val +
      "&size=1&focus.point.lat=" +
      currentCenter.lat +
      "&focus.point.lon=" +
      currentCenter.lng
    xmlHttp.open("GET", encodeURI(url), true)
    if (DIGITRANSIT_APIKEY) {
      xmlHttp.setRequestHeader("digitransit-subscription-key", DIGITRANSIT_APIKEY)
    }
    xmlHttp.send(null)
  }
}

function emptyDate() {
  document.getElementById("datepicker").value = ""
}

function updateMap() {
  const datepickerdiv = document.getElementById("datepicker").value
  moment.locale("fi")
  const momentDate = moment(datepickerdiv, "L").format("YYYY-MM-DD")
  map = new mapboxgl.Map({
    container: "map",
    center: [24.9384, 60.1699],
    style: `style.json/${momentDate}`,
    zoom: 10
  })
  setOnClickEvent()
}

var elem = document.getElementById("location-search")
elem.addEventListener("keypress", function(e) {
  if (e.keyCode == 13) {
    search()
  }
})

map.addControl(new mapboxgl.NavigationControl(), "top-left")
