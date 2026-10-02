/* Kiez — Berlin neighborhood tour. Independent of Mirai. */
(function () {
  const PHOTON = "https://photon.komoot.io/api/";
  const OVERPASS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
  ];
  function seedPlaces(home) {
    const raw = [
      { name: "Barcomi's Kaffeerösterei", cat: "coffee", lat: 52.48962, lon: 13.39385, file: COMMONS.cafe },
      { name: "Marheineke Markthalle", cat: "grocery", lat: 52.48945, lon: 13.39555, file: COMMONS.market },
      { name: "Café Liberda", cat: "coffee", lat: 52.4994, lon: 13.4249, file: COMMONS.cafe },
      { name: "Café Moritzplatz", cat: "coffee", lat: 52.5035, lon: 13.4108, file: COMMONS.cafe2 },
      { name: "Viktoriapark", cat: "park", lat: 52.4884, lon: 13.3816, file: COMMONS.park },
      { name: "Chamissokiez gardens", cat: "park", lat: 52.4880, lon: 13.3912, file: COMMONS.street },
      { name: "Bergmannstraße shops", cat: "eat", lat: 52.4897, lon: 13.3928, file: COMMONS.cafe3 },
      { name: "Kreuzberg town hall block", cat: "do", lat: 52.4912, lon: 13.3889, file: COMMONS.street },
    ];
    return raw.map(function (p) {
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
      };
    }).sort(function (a, b) { return a.dist - b.dist; });
  }
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

  function $(sel, root) {
    return (root || document).querySelector(sel);
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

  async function geocode(q) {
    const res = await fetch(PHOTON + "?q=" + encodeURIComponent(q) + "&limit=5&lang=en");
    if (!res.ok) throw new Error("Address lookup failed");
    const data = await res.json();
    const f = (data.features || [])[0];
    if (!f) throw new Error("No match for that address");
    const [lon, lat] = f.geometry.coordinates;
    const p = f.properties || {};
    const label = p.name || [p.street, p.housenumber].filter(Boolean).join(" ") || q;
    const display = [label, p.district, p.city || p.town, p.country].filter(Boolean).join(", ");
    return { lat: lat, lon: lon, label: label, display: display };
  }

  function catOf(t) {
    if (t.amenity === "cafe" || t.shop === "bakery" || t.shop === "coffee") return "coffee";
    if (["supermarket", "convenience", "greengrocer"].indexOf(t.shop) >= 0) return "grocery";
    if (t.leisure === "park" || t.leisure === "garden" || t.leisure === "nature_reserve") return "park";
    if (t.amenity === "restaurant" || t.amenity === "bar") return "eat";
    if (t.tourism === "attraction" || t.tourism === "museum" || t.amenity === "theatre") return "do";
    return null;
  }

  function nodeCenter(e) {
    if (e.type === "node") return { lat: e.lat, lon: e.lon };
    if (e.center) return { lat: e.center.lat, lon: e.center.lon };
    return null;
  }

  function photoFor(place) {
    const t = place.tags || {};
    if (t.wikimedia_commons) return filePath(t.wikimedia_commons.replace(/^File:/, ""));
    if (t.image && /^https?:/.test(t.image)) return t.image;
    if (place.cat === "park") return filePath(COMMONS.park);
    if (place.cat === "grocery") return filePath(COMMONS.market);
    if (place.cat === "coffee") return filePath(place.dist % 2 ? COMMONS.cafe : COMMONS.cafe2);
    if (place.cat === "eat") return filePath(COMMONS.cafe3);
    return filePath(COMMONS.street);
  }

  async function fetchPois(home) {
    const q =
      "[out:json][timeout:25];(" +
      "nwr(around:1200," + home.lat + "," + home.lon + ")[amenity~\"cafe|restaurant|bar\"][name];" +
      "nwr(around:1200," + home.lat + "," + home.lon + ")[shop~\"supermarket|bakery|convenience\"][name];" +
      "nwr(around:1200," + home.lat + "," + home.lon + ")[leisure~\"park|garden\"][name];" +
      "nwr(around:1200," + home.lat + "," + home.lon + ")[tourism~\"attraction|museum\"][name];" +
      ");out tags center 80;";
    const body = "data=" + encodeURIComponent(q);
    let lastErr;
    for (let i = 0; i < OVERPASS.length; i++) {
      try {
        const res = await fetch(OVERPASS[i], {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
          body: body,
        });
        if (!res.ok) throw new Error("overpass " + res.status);
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
          out.push(place);
        });
        out.sort(function (a, b) {
          return a.dist - b.dist;
        });
        return out.slice(0, 40);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("Places lookup failed");
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
      zoom: 16.2,
      pitch: 60,
      bearing: -18,
      attributionControl: true,
    });
    map.on("load", function () {
      add3d(map);
    });
    return map;
  }

  function pin(map, ll, color, title) {
    const node = document.createElement("div");
    node.title = title || "";
    node.style.cssText =
      "width:14px;height:14px;border-radius:50% 50% 50% 0;background:" +
      color +
      ";transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.3)";
    return new window.maplibregl.Marker({ element: node }).setLngLat([ll.lon, ll.lat]).addTo(map);
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
    lifeStep: 1,
    household: {},
    interests: {},
    day: { morning: null, afternoon: null, evening: null },
    daySlot: null,
  };

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
    if (i === 0 && state.map) state.map.resize();
    if (i === 3 && state.cmap) {
      state.cmap.resize();
      ensureCommute();
    }
    if (i === 2) renderGallery("all");
  }

  function nearest(cat) {
    return state.places.filter(function (p) {
      return p.cat === cat;
    })[0];
  }

  function renderWalkChip() {
    const cafe = nearest("coffee");
    const chip = $("#coffee-chip");
    if (!chip) return;
    if (cafe) {
      chip.querySelector("strong").textContent = "Coffee";
      chip.querySelector("small").textContent = cafe.walk + " min walk";
      chip.title = cafe.name;
    }
  }

  function clearMarkers() {
    state.markers.forEach(function (m) {
      m.remove();
    });
    state.markers = [];
  }

  function showHomePins() {
    if (!state.map || !state.home) return;
    clearMarkers();
    state.markers.push(pin(state.map, state.home, "#14110e", state.home.label));
    state.places.slice(0, 18).forEach(function (p) {
      const col = p.cat === "coffee" ? "#c45c2d" : p.cat === "park" ? "#3f6b4a" : "#14110e";
      const m = pin(state.map, p, col, p.name);
      m.getElement().style.cursor = "pointer";
      m.getElement().addEventListener("click", function () {
        const cafeChip = $("#coffee-chip");
        cafeChip.querySelector("strong").textContent = p.name;
        cafeChip.querySelector("small").textContent = p.walk + " min walk";
        state.map.flyTo({ center: [p.lon, p.lat], zoom: 17, pitch: 62, speed: 0.7 });
      });
      state.markers.push(m);
    });
  }

  function renderGallery(tab) {
    const mapTab = { all: null, parks: "park", nature: "park", restaurants: "eat", cafes: "coffee", do: "do" };
    const cat = mapTab[tab];
    let rows = state.places.slice();
    if (cat) rows = rows.filter(function (p) { return p.cat === cat; });
    if (!rows.length) rows = [{ name: "Bergmannkiez", cat: "do", photo: filePath(COMMONS.street), walk: 1, tags: {} }];
    const hero = rows[0];
    const sides = rows.slice(1, 4);
    const hs = $("#hero-shot");
    hs.innerHTML =
      '<img alt="" src="' +
      hero.photo +
      '"><div class="cap"><h3></h3><p></p></div>';
    hs.querySelector("h3").textContent = hero.name;
    hs.querySelector("p").textContent = (hero.walk ? hero.walk + " min walk · " : "") + (hero.cat || "");
    const side = $("#sides");
    side.innerHTML = "";
    (sides.length ? sides : rows).slice(0, 3).forEach(function (p) {
      const el = document.createElement("button");
      el.className = "side-shot";
      el.type = "button";
      el.innerHTML = '<img alt=""><span></span>';
      el.querySelector("img").src = p.photo;
      el.querySelector("span").textContent = p.name;
      el.addEventListener("click", function () {
        rows.unshift(rows.splice(rows.indexOf(p), 1)[0]);
        renderGallery(tab);
        if (state.map) state.map.flyTo({ center: [p.lon, p.lat], zoom: 16.5, speed: 0.8 });
      });
      side.append(el);
    });
    document.querySelectorAll(".tabs button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-tab") === tab);
    });
  }

  async function ensureCommute() {
    if (!state.home || !state.cmap) return;
    try {
      const to = await geocode(WORK);
      const r = await osrmRoute(state.home, to, "driving");
      drawRoute(state.cmap, r.coords);
      const b = new window.maplibregl.LngLatBounds();
      b.extend([state.home.lon, state.home.lat]);
      b.extend([to.lon, to.lat]);
      state.cmap.fitBounds(b, { padding: 60, pitch: 55, duration: 700 });
      pin(state.cmap, state.home, "#14110e", "Home");
      pin(state.cmap, to, "#e07a3d", to.label);
      $("#c-min").textContent = r.mins + " min";
      $("#c-km").textContent = (r.meters / 1000).toFixed(1) + " km";
    } catch (_) {
      $("#c-min").textContent = "—";
    }
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
        el.innerHTML = '<img alt=""><h4></h4><p></p>';
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
    state.daySlot = slot;
    const want = slot === "morning" ? "coffee" : slot === "afternoon" ? "park" : "eat";
    const rows = state.places.filter(function (p) {
      return p.cat === want;
    }).slice(0, 3);
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
      if (!state.map) state.map = makeMap("map", home);
      else state.map.flyTo({ center: [home.lon, home.lat], zoom: 16.2, pitch: 60, speed: 0.8 });
      if (!state.cmap) state.cmap = makeMap("c-map", home);
      if (loader) loader.hidden = true;
      state.places = seedPlaces(home);
      showHomePins();
      renderWalkChip();
      renderGallery("all");
      fetchPois(home)
        .then(function (live) {
          if (live && live.length >= 3) {
            state.places = live;
            showHomePins();
            renderWalkChip();
            if (state.slide === 2) renderGallery("all");
          }
        })
        .catch(function () {});
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
    document.querySelectorAll(".hh").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const k = btn.getAttribute("data-k");
        state.household[k] = !state.household[k];
        btn.classList.toggle("on", state.household[k]);
        $("#hh-n").textContent = countSel(state.household) + " selected";
      });
    });
    document.querySelectorAll(".int").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const k = btn.getAttribute("data-k");
        state.interests[k] = !state.interests[k];
        btn.classList.toggle("on", state.interests[k]);
        $("#int-n").textContent = countSel(state.interests) + " selected";
      });
    });
    $("#life-next").addEventListener("click", function () {
      $("#life-1").hidden = true;
      $("#life-2").hidden = false;
    });
    $("#life-build").addEventListener("click", function () {
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
      const p = state.day.morning || state.day.afternoon || state.day.evening;
      if (p && state.map) {
        setSlide(0);
        state.map.flyTo({ center: [p.lon, p.lat], zoom: 16.8, pitch: 62, speed: 0.7 });
      }
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
