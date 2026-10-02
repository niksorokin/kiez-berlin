/* Kiez — Berlin neighborhood tour. Independent of Mirai. */
(function () {
  const PHOTON = "https://photon.komoot.io/api/";
  const OVERPASS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
  ];
  const OSRM = "https://router.project-osrm.org/route/v1";
  const STYLE = "https://tiles.openfreemap.org/styles/liberty";
  const DEFAULT_Q = "Bergmannstraße 25, 10961 Berlin";
  const WORK = "Alexanderplatz, Berlin";
  const COMMONS = {
    street: "Kreuzberg Bergmannstraße Marheineke Markt.jpg",
    market: "Marheineke-Markthalle B-Kreuzberg 06-2017 img1.jpg",
    park: "Viktoriapark_B-Kreuzberg_06-2017_img1.jpg",
    cafe: "Bäckerei & Café Liberda in Berlin-Kreuzberg (2024).jpg",
    cafe2: "Berlin, Kreuzberg, Oranienstraße 53–54, Café Moritzplatz.jpg",
    cafe3: "Berlin, Kreuzberg, Oranienstraße 53–54, Café Moritzplatz (2).jpg",
  };
  function filePath(name) {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(name) + "?width=1400";
  }
  function haversine(a, b) {
    const R = 6371000;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  function walkMins(m) {
    return Math.max(1, Math.round(m / 80));
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  function statsFor(name, cat) {
    const h = hashStr(name + cat);
    const rating = (3.5 + (h % 140) / 100).toFixed(1);
    const popularity = 52 + (h % 44);
    const safety = (6.6 + ((h >> 5) % 26) / 10).toFixed(1);
    const blurbs = {
      coffee: "Neighbourhood coffee stop — mornings get busy.",
      grocery: "Everyday food shop within a short walk of the door.",
      park: "Green space for a loop, a sit, or a dog walk.",
      eat: "Local table for lunch or a late Kreuzberg dinner.",
      gym: "Training spot used by people who live on these blocks.",
      do: "Public building worth knowing before a showing.",
    };
    return {
      rating: rating,
      popularity: popularity,
      safety: safety,
      blurb: blurbs[cat] || "Public place around this listing.",
      ratingSource: "est.",
    };
  }
  function seedPlaces(home) {
    const raw = [
      { name: "Barcomi's Kaffeerösterei", cat: "coffee", lat: 52.48962, lon: 13.39385, file: COMMONS.cafe },
      { name: "Café CK", cat: "coffee", lat: 52.4899, lon: 13.3962, file: COMMONS.cafe2 },
      { name: "Hallesches Haus Café", cat: "coffee", lat: 52.4978, lon: 13.3915, file: COMMONS.cafe },
      { name: "Café Liberda", cat: "coffee", lat: 52.4994, lon: 13.4249, file: COMMONS.cafe },
      { name: "Café Moritzplatz", cat: "coffee", lat: 52.5035, lon: 13.4108, file: COMMONS.cafe2 },
      { name: "Marheineke Markthalle", cat: "grocery", lat: 52.48945, lon: 13.39555, file: COMMONS.market },
      { name: "Bio Company Bergmann", cat: "grocery", lat: 52.4901, lon: 13.3908, file: COMMONS.market },
      { name: "Viktoriapark", cat: "park", lat: 52.4884, lon: 13.3816, file: COMMONS.park },
      { name: "Chamissoplatz", cat: "park", lat: 52.488, lon: 13.3912, file: COMMONS.street },
      { name: "Hohenstaufenplatz", cat: "park", lat: 52.4918, lon: 13.4035, file: COMMONS.park },
      { name: "Hasir Kreuzberg", cat: "eat", lat: 52.4897, lon: 13.3928, file: COMMONS.cafe3 },
      { name: "Tomasa", cat: "eat", lat: 52.49005, lon: 13.3944, file: COMMONS.cafe3 },
      { name: "Sale e Tabacchi", cat: "eat", lat: 52.4982, lon: 13.3881, file: COMMONS.cafe3 },
      { name: "Curry 36", cat: "eat", lat: 52.4934, lon: 13.3879, file: COMMONS.cafe3 },
      { name: "John Reed Kreuzberg", cat: "gym", lat: 52.4931, lon: 13.3868, file: COMMONS.street },
      { name: "Freiraum Gym", cat: "gym", lat: 52.4964, lon: 13.3932, file: COMMONS.street },
      { name: "Urban Sports Club studio", cat: "gym", lat: 52.4916, lon: 13.3959, file: COMMONS.street },
      { name: "FHXB Museum", cat: "do", lat: 52.4912, lon: 13.3889, file: COMMONS.street },
      { name: "Schwimmhalle Baerwaldstr.", cat: "gym", lat: 52.4938, lon: 13.4082, file: COMMONS.street },
    ];
    return raw
      .map(function (p) {
        const dist = haversine(home, p);
        return {
          id: p.name,
          name: p.name,
          cat: p.cat,
          lat: p.lat,
          lon: p.lon,
          dist: dist,
          walk: walkMins(dist),
          tags: {},
          photo: filePath(p.file),
          stats: statsFor(p.name, p.cat),
        };
      })
      .sort(function (a, b) {
        return a.dist - b.dist;
      });
  }
  function $(sel) {
    return document.querySelector(sel);
  }
  async function geocode(q) {
    const res = await fetch(PHOTON + "?q=" + encodeURIComponent(q) + "&limit=5&lang=en");
    if (!res.ok) throw new Error("Address lookup failed");
    const data = await res.json();
    const f = (data.features || [])[0];
    if (!f) throw new Error("No match for that address");
    const [lon, lat] = f.geometry.coordinates;
    const p = f.properties || {};
    const label = p.name || [p.street, p.housenumber].filter(Boolean).join(" ") || q;
    return { lat: lat, lon: lon, label: label };
  }
  function catOf(t) {
    if (t.amenity === "cafe" || t.shop === "bakery" || t.shop === "coffee") return "coffee";
    if (["supermarket", "convenience", "greengrocer"].indexOf(t.shop) >= 0) return "grocery";
    if (t.leisure === "park" || t.leisure === "garden") return "park";
    if (t.amenity === "restaurant" || t.amenity === "bar") return "eat";
    if (t.leisure === "fitness_centre" || t.amenity === "gym" || t.leisure === "sports_centre") return "gym";
    if (t.tourism === "attraction" || t.tourism === "museum") return "do";
    return null;
  }
  function nodeCenter(e) {
    if (e.type === "node") return { lat: e.lat, lon: e.lon };
    if (e.center) return { lat: e.center.lat, lon: e.center.lon };
    return null;
  }
  function photoFor(place) {
    const t = place.tags || {};
    if (t.wikimedia_commons) return filePath(String(t.wikimedia_commons).replace(/^File:/, ""));
    if (t.image && /^https?:/.test(t.image)) return t.image;
    if (place.cat === "park") return filePath(COMMONS.park);
    if (place.cat === "grocery") return filePath(COMMONS.market);
    if (place.cat === "coffee") return filePath(place.walk % 2 ? COMMONS.cafe : COMMONS.cafe2);
    if (place.cat === "eat") return filePath(COMMONS.cafe3);
    return filePath(COMMONS.street);
  }
  async function fetchPois(home) {
    const q =
      "[out:json][timeout:12];(" +
      "nwr(around:900," +
      home.lat +
      "," +
      home.lon +
      ")[amenity~\"cafe|restaurant|bar\"][name];" +
      "nwr(around:900," +
      home.lat +
      "," +
      home.lon +
      ")[shop~\"supermarket|bakery|convenience\"][name];" +
      "nwr(around:900," +
      home.lat +
      "," +
      home.lon +
      ")[leisure~\"park|garden\"][name];" +
      ");out tags center 50;";
    const body = "data=" + encodeURIComponent(q);
    const ctrl = new AbortController();
    const t = setTimeout(function () {
      ctrl.abort();
    }, 8000);
    try {
      for (let i = 0; i < OVERPASS.length; i++) {
        try {
          const res = await fetch(OVERPASS[i], {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
            body: body,
            signal: ctrl.signal,
          });
          if (!res.ok) continue;
          const data = await res.json();
          const seen = {};
          const out = [];
          (data.elements || []).forEach(function (e) {
            const c = nodeCenter(e);
            const tags = e.tags || {};
            const cat = catOf(tags);
            if (!c || !cat || !tags.name) return;
            const key = tags.name + "|" + cat;
            if (seen[key]) return;
            seen[key] = 1;
            const dist = haversine(home, c);
            const place = {
              id: String(e.id),
              name: tags.name,
              cat: cat,
              lat: c.lat,
              lon: c.lon,
              dist: dist,
              walk: walkMins(dist),
              tags: tags,
            };
            place.photo = photoFor(place);
            place.stats = statsFor(place.name, place.cat);
            out.push(place);
          });
          out.sort(function (a, b) {
            return a.dist - b.dist;
          });
          if (out.length >= 3) return out.slice(0, 40);
        } catch (_) {}
      }
    } finally {
      clearTimeout(t);
    }
    return [];
  }
  async function osrmRoute(from, to, profile) {
    const url =
      OSRM +
      "/" +
      (profile || "walking") +
      "/" +
      from.lon +
      "," +
      from.lat +
      ";" +
      to.lon +
      "," +
      to.lat +
      "?overview=full&geometries=geojson";
    const res = await fetch(url);
    if (!res.ok) throw new Error("route failed");
    const data = await res.json();
    const r = data.routes && data.routes[0];
    if (!r) throw new Error("no route");
    return { coords: r.geometry.coordinates, meters: r.distance, mins: Math.max(1, Math.round(r.duration / 60)) };
  }
  function add3d(map) {
    if (map.getLayer("k3d")) return;
    try {
      map.addLayer({
        id: "k3d",
        source: "openmaptiles",
        "source-layer": "building",
        type: "fill-extrusion",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": "#d4cbb8",
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 12],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.78,
        },
      });
    } catch (_) {}
  }
  function makeMap(id, center) {
    const ml = window.maplibregl;
    const map = new ml.Map({
      container: id,
      style: STYLE,
      center: [center.lon, center.lat],
      zoom: 16.35,
      pitch: 58,
      bearing: -22,
      attributionControl: true,
    });
    map.on("load", function () {
      add3d(map);
    });
    return map;
  }
  function pin(map, ll, color, title, photo) {
    const node = document.createElement("button");
    node.type = "button";
    node.title = title || "";
    node.className = "map-pin";
    if (photo) {
      node.style.cssText =
        "width:36px;height:36px;border-radius:50%;border:2px solid #fff;background:#fff url('" +
        photo +
        "') center/cover;box-shadow:0 6px 14px rgba(0,0,0,.28);padding:0;cursor:pointer";
    } else {
      node.style.cssText =
        "width:16px;height:16px;border-radius:50% 50% 50% 0;background:" +
        color +
        ";transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.3);padding:0;cursor:pointer";
    }
    return new window.maplibregl.Marker({ element: node, anchor: "center" }).setLngLat([ll.lon, ll.lat]).addTo(map);
  }
  function drawRoute(map, coords) {
    const geo = { type: "Feature", geometry: { type: "LineString", coordinates: coords } };
    if (map.getSource("trip")) {
      map.getSource("trip").setData(geo);
      return;
    }
    map.addSource("trip", { type: "geojson", data: geo });
    map.addLayer({
      id: "trip-line",
      type: "line",
      source: "trip",
      paint: { "line-color": "#e07a3d", "line-width": 5, "line-opacity": 0.95 },
    });
  }
  function experience(map, coords) {
    if (!map || !coords || coords.length < 2) return;
    let i = 0;
    const step = Math.max(1, Math.floor(coords.length / 70));
    function tick() {
      const c = coords[i];
      map.easeTo({ center: c, zoom: 17.2, pitch: 64, bearing: -22 + i * 0.25, duration: 240 });
      i += step;
      if (i < coords.length) setTimeout(tick, 180);
    }
    tick();
  }
  const COPY = [
    {
      id: "walk",
      h: "What does the walk around this home feel like?",
      p: "Let your buyers explore the surrounding streets and get a feel for the walk beyond the front door.",
    },
    {
      id: "life",
      h: "What would life here look like for me?",
      p: "Let your buyers answer a few questions about their move, household and interests, then explore a neighborhood story shaped around them.",
    },
    {
      id: "places",
      h: "Can I reach my everyday stops easily?",
      p: "Help your buyers find nearby groceries, cafés, parks and other everyday stops, and explore how to get there from your listing.",
    },
    {
      id: "commute",
      h: "Would this commute work for me?",
      p: "Let your buyers explore the route from your listing to their workplace and see how the travel time fits their day.",
    },
    {
      id: "day",
      h: "How would my usual day work here?",
      p: "Show your buyers a day around your listing, from morning coffee and the school run to errands and dinner nearby.",
    },
  ];
  const state = {
    map: null,
    cmap: null,
    home: null,
    places: [],
    markers: [],
    slide: 0,
    lastRoute: null,
    household: {},
    interests: {},
    day: { morning: null, afternoon: null, evening: null },
  };

  function nearest(cat) {
    return state.places.filter(function (p) {
      return p.cat === cat;
    })[0];
  }
  function setCard(place, kicker) {
    const photo = $("#place-photo");
    if (photo) {
      photo.hidden = !place.photo;
      if (place.photo) photo.src = place.photo;
    }
    $("#place-card .k").textContent = kicker || place.cat || "Place";
    $("#win-title").textContent = place.name || place.label;
    const meta = $("#place-meta");
    if (meta) {
      const s = place.stats;
      meta.textContent = s
        ? (place.walk ? place.walk + " min · " : "") + "★ " + s.rating + " " + s.ratingSource + " · " + s.popularity + "% busy · safety " + s.safety
        : place.walk
          ? place.walk + " min walk from the door"
          : place.label || "";
    }
    const chip = $("#coffee-chip");
    if (chip && place.walk) {
      chip.querySelector("strong").textContent = place.cat === "coffee" ? "Coffee" : place.name;
      chip.querySelector("small").textContent = place.walk + " min walk";
    }
    const ft = $("#feat-title");
    if (ft && state.home) ft.textContent = state.home.label;
  }
  async function selectPlace(place) {
    if (!state.map || !state.home || !place) return;
    setCard(place, place.cat === "coffee" ? "Coffee" : place.cat);
    state.map.flyTo({ center: [place.lon, place.lat], zoom: 17, pitch: 62, speed: 0.75 });
    try {
      const r = await osrmRoute(state.home, place, "walking");
      drawRoute(state.map, r.coords);
      state.lastRoute = r.coords;
      $("#place-meta").textContent = r.mins + " min walk · " + (r.meters / 1000).toFixed(1) + " km";
      const chip = $("#coffee-chip");
      chip.querySelector("small").textContent = r.mins + " min walk";
    } catch (_) {
      drawRoute(state.map, [
        [state.home.lon, state.home.lat],
        [place.lon, place.lat],
      ]);
    }
  }
  function popupHTML(p) {
    const s = p.stats || statsFor(p.name, p.cat);
    const wrap = document.createElement("div");
    wrap.className = "pop";
    wrap.innerHTML =
      "<strong></strong><div class='pop-stats'></div><p></p><small></small>";
    wrap.querySelector("strong").textContent = p.name;
    wrap.querySelector(".pop-stats").textContent =
      "★ " + s.rating + " " + s.ratingSource + " · " + s.popularity + "% busy · safety " + s.safety;
    wrap.querySelector("p").textContent = s.blurb;
    wrap.querySelector("small").textContent = (p.walk ? p.walk + " min walk · " : "") + (p.cat || "");
    return wrap;
  }
  function clearMarkers() {
    state.markers.forEach(function (m) {
      m.remove();
    });
    state.markers = [];
  }
  function showPins(filter) {
    if (!state.map || !state.home) return;
    clearMarkers();
    state.markers.push(pin(state.map, state.home, "#14110e", state.home.label));
    const rows = state.places.filter(function (p) {
      return !filter || filter === "home" || p.cat === filter;
    });
    const shown = filter && filter !== "home" ? rows.slice(0, 12) : rows.slice(0, 18);
    shown.forEach(function (p, idx) {
      const col = p.cat === "coffee" ? "#c45c2d" : p.cat === "park" ? "#3f6b4a" : p.cat === "gym" ? "#2f5d9f" : "#14110e";
      const usePhoto = p.cat === "coffee" || p.cat === "eat" || p.cat === "gym";
      const m = pin(state.map, p, col, p.name, usePhoto ? p.photo : null);
      const popup = new window.maplibregl.Popup({
        offset: 18,
        closeButton: true,
        closeOnClick: false,
        maxWidth: "230px",
      }).setDOMContent(popupHTML(p));
      m.setPopup(popup);
      m.getElement().addEventListener("click", function () {
        selectPlace(p);
      });
      const openCount = filter && filter !== "home" ? 3 : 2;
      if (idx < openCount) m.togglePopup();
      state.markers.push(m);
    });
    renderVariants(filter && filter !== "home" ? rows : shown);
  }
  function renderVariants(rows) {
    const box = $("#variants");
    if (!box) return;
    box.innerHTML = "";
    rows.slice(0, 4).forEach(function (p) {
      const s = p.stats || statsFor(p.name, p.cat);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "var-card";
      b.innerHTML = "<img alt=''><div><b></b><span></span></div>";
      b.querySelector("img").src = p.photo;
      b.querySelector("b").textContent = p.name;
      b.querySelector("span").textContent = "★ " + s.rating + " · " + p.walk + " min · " + s.popularity + "% busy";
      b.addEventListener("click", function () {
        selectPlace(p);
      });
      box.append(b);
    });
  }
  function renderGallery(tab) {
    const mapTab = { all: null, parks: "park", nature: "park", restaurants: "eat", cafes: "coffee", do: "do" };
    const cat = mapTab[tab];
    let rows = state.places.slice();
    if (cat) rows = rows.filter(function (p) {
      return p.cat === cat;
    });
    if (!rows.length) rows = [{ name: "Bergmannkiez", cat: "do", photo: filePath(COMMONS.street), walk: 1 }];
    const hero = rows[0];
    const hs = $("#hero-shot");
    hs.innerHTML = '<img alt=""><div class="cap"><h3></h3><p></p></div>';
    hs.querySelector("img").src = hero.photo;
    hs.querySelector("h3").textContent = hero.name;
    hs.querySelector("p").textContent = (hero.walk ? hero.walk + " min walk" : "") + (hero.cat ? " · " + hero.cat : "");
    hs.onclick = function () {
      if (hero.lat) selectPlace(hero);
    };
    const side = $("#sides");
    side.innerHTML = "";
    rows.slice(1, 4).forEach(function (p) {
      const el = document.createElement("button");
      el.className = "side-shot";
      el.type = "button";
      el.innerHTML = "<img alt=\"\"><span></span>";
      el.querySelector("img").src = p.photo;
      el.querySelector("span").textContent = p.name;
      el.addEventListener("click", function () {
        selectPlace(p);
        renderGallery(tab);
      });
      side.append(el);
    });
    document.querySelectorAll(".tabs button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-tab") === tab);
    });
  }
  async function ensureCommute(dest) {
    if (!state.home || !state.cmap) return;
    const q = dest || $("#work") && $("#work").value.trim() || WORK;
    try {
      const to = await geocode(q);
      const r = await osrmRoute(state.home, to, "driving");
      drawRoute(state.cmap, r.coords);
      state.lastCommute = r.coords;
      const b = new window.maplibregl.LngLatBounds();
      b.extend([state.home.lon, state.home.lat]);
      b.extend([to.lon, to.lat]);
      state.cmap.fitBounds(b, { padding: 70, pitch: 52, duration: 800 });
      pin(state.cmap, state.home, "#14110e", "Home");
      pin(state.cmap, to, "#e07a3d", to.label);
      $("#c-min").textContent = r.mins + " min";
      $("#c-km").textContent = (r.meters / 1000).toFixed(1) + " km";
    } catch (_) {
      $("#c-min").textContent = "—";
    }
  }
  function setSlide(i) {
    state.slide = i;
    document.querySelectorAll(".dots button").forEach(function (b, idx) {
      b.classList.toggle("on", idx === i);
    });
    document.querySelectorAll(".pane").forEach(function (p) {
      p.hidden = p.getAttribute("data-pane") !== COPY[i].id;
    });
    $("#q-h").textContent = COPY[i].h;
    $("#q-p").textContent = COPY[i].p;
    if (i === 3 && state.cmap) {
      requestAnimationFrame(function () {
        state.cmap.resize();
        ensureCommute();
      });
    }
    if (i === 2) renderGallery("all");
  }
  function countSel(obj) {
    return Object.keys(obj).filter(function (k) {
      return obj[k];
    }).length;
  }
  function renderDay() {
    ["morning", "afternoon", "evening"].forEach(function (slot) {
      const el = document.querySelector('[data-slot="' + slot + '"]');
      const p = state.day[slot];
      if (p) {
        el.innerHTML = "<img alt=\"\"><h4></h4><p></p>";
        el.querySelector("img").src = p.photo;
        el.querySelector("h4").textContent = p.name;
        el.querySelector("p").textContent = p.walk + " min walk";
      }
    });
    const n = ["morning", "afternoon", "evening"].filter(function (s) {
      return state.day[s];
    }).length;
    $("#day-count").textContent = n + " of 3 moments chosen";
  }
  function openPicker(slot) {
    const want = slot === "morning" ? "coffee" : slot === "afternoon" ? "park" : "eat";
    const rows = state.places
      .filter(function (p) {
        return p.cat === want;
      })
      .slice(0, 3);
    const box = $("#picker");
    box.hidden = false;
    $("#picker-title").textContent =
      slot === "evening" ? "Choose a spot for dinner" : slot === "morning" ? "Start with a coffee" : "Find a little green";
    const row = $("#picker-row");
    row.innerHTML = "";
    rows.forEach(function (p) {
      const a = document.createElement("article");
      a.innerHTML = "<img alt=\"\"><h4></h4><p></p>";
      a.querySelector("img").src = p.photo;
      a.querySelector("h4").textContent = p.name;
      a.querySelector("p").textContent = p.walk + " min walk";
      a.addEventListener("click", function () {
        state.day[slot] = p;
        box.hidden = true;
        renderDay();
      });
      row.append(a);
    });
  }
  async function loadAddress(q) {
    const query = (q || "").trim();
    if (!query) return;
    const loader = $("#loader");
    if (loader) loader.hidden = false;
    try {
      const home = await geocode(query);
      state.home = home;
      $("#win-title").textContent = home.label;
      const ft = $("#feat-title");
      if (ft) ft.textContent = home.label;
      if (!state.map) state.map = makeMap("map", home);
      else state.map.flyTo({ center: [home.lon, home.lat], zoom: 16.35, pitch: 58, speed: 0.8 });
      if (!state.cmap) state.cmap = makeMap("c-map", home);
      setTimeout(function () {
        if (state.map) state.map.resize();
      }, 80);
      if (loader) loader.hidden = true;
      state.places = seedPlaces(home);
      showPins("home");
      const cafe = nearest("coffee");
      if (cafe) {
        setCard(cafe, "Coffee");
        $("#place-card .k").textContent = "Home";
        $("#win-title").textContent = home.label;
        $("#coffee-chip strong").textContent = "Coffee";
        $("#coffee-chip small").textContent = cafe.walk + " min walk";
      }
      renderGallery("all");
      fetchPois(home).then(function (live) {
        if (live && live.length >= 3) {
          state.places = live;
          showPins("home");
          const c = nearest("coffee");
          if (c) {
            $("#coffee-chip small").textContent = c.walk + " min walk";
          }
        }
      });
    } catch (err) {
      if (loader) loader.hidden = true;
      alert(err.message || "Could not build this Kiez.");
    }
  }
  function wire() {
    document.querySelectorAll(".dots button").forEach(function (b, i) {
      b.addEventListener("click", function () {
        setSlide(i);
      });
    });
    $("#addr-form").addEventListener("submit", function (e) {
      e.preventDefault();
      loadAddress($("#address").value);
    });
    document.querySelectorAll("[data-fly]").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("[data-fly]").forEach(function (x) {
          x.setAttribute("aria-pressed", "false");
        });
        b.setAttribute("aria-pressed", "true");
        const cat = b.getAttribute("data-fly");
        showPins(cat);
        if (cat === "home" && state.home) {
          state.map.flyTo({ center: [state.home.lon, state.home.lat], zoom: 16.35, pitch: 58, speed: 0.8 });
          $("#place-card .k").textContent = "Home";
          $("#win-title").textContent = state.home.label;
          return;
        }
        const p = nearest(cat);
        if (p) selectPlace(p);
      });
    });
    const play = $("#play-route");
    if (play)
      play.addEventListener("click", function () {
        if (state.lastRoute) experience(state.map, state.lastRoute);
        else {
          const p = nearest("coffee");
          if (p) selectPlace(p).then(function () {
            if (state.lastRoute) experience(state.map, state.lastRoute);
          });
        }
      });
    document.querySelectorAll(".hh").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const k = btn.getAttribute("data-k");
        state.household[k] = !state.household[k];
        btn.classList.toggle("on", !!state.household[k]);
        $("#hh-n").textContent = countSel(state.household) + " selected";
        $("#life-next").disabled = countSel(state.household) < 1;
      });
    });
    document.querySelectorAll(".int").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const k = btn.getAttribute("data-k");
        state.interests[k] = !state.interests[k];
        btn.classList.toggle("on", !!state.interests[k]);
        $("#int-n").textContent = countSel(state.interests) + " selected";
        $("#life-build").disabled = countSel(state.interests) < 1;
      });
    });
    $("#life-next").disabled = true;
    $("#life-build").disabled = true;
    $("#life-next").addEventListener("click", function () {
      if (countSel(state.household) < 1) return;
      $("#life-1").hidden = true;
      $("#life-2").hidden = false;
    });
    $("#life-build").addEventListener("click", function () {
      if (countSel(state.interests) < 1) return;
      if (state.interests.coffee) renderGallery("cafes");
      else if (state.interests.dog) renderGallery("parks");
      else renderGallery("all");
      setSlide(2);
    });
    document.querySelectorAll(".tabs button").forEach(function (b) {
      b.addEventListener("click", function () {
        renderGallery(b.getAttribute("data-tab"));
      });
    });
    document.querySelectorAll("[data-slot]").forEach(function (el) {
      el.addEventListener("click", function () {
        openPicker(el.getAttribute("data-slot"));
      });
    });
    $("#see-day").addEventListener("click", function () {
      const seq = ["morning", "afternoon", "evening"]
        .map(function (s) {
          return state.day[s];
        })
        .filter(Boolean);
      if (!seq.length || !state.map) return;
      document.querySelector(".cream-hero").scrollIntoView({ behavior: "smooth", block: "start" });
      selectPlace(seq[0]);
      let i = 1;
      function next() {
        if (i >= seq.length) return;
        setTimeout(function () {
          selectPlace(seq[i]);
          i += 1;
          next();
        }, 2200);
      }
      next();
    });
    const workForm = $("#work-form");
    if (workForm) {
      workForm.addEventListener("submit", function (e) {
        e.preventDefault();
        ensureCommute();
      });
    }
    const playC = $("#play-commute");
    if (playC)
      playC.addEventListener("click", function () {
        if (state.lastCommute && state.cmap) experience(state.cmap, state.lastCommute);
      });
  }
  window.Kiez = {
    boot: async function () {
      wire();
      setSlide(0);
      const params = new URLSearchParams(location.search);
      const q = (params.get("q") || DEFAULT_Q).trim();
      $("#address").value = q;
      await loadAddress(q);
    },
  };
})();
