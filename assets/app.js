/* Kiez rebuild — Astra prompt. Independent of Mirai. */
(function () {
  const PHOTON = "https://photon.komoot.io/api/";
  const OSRM = "https://router.project-osrm.org/route/v1";
  const STYLE = "https://tiles.openfreemap.org/styles/liberty";
  const DEFAULT_Q = "Bergmannstraße 25, 10961 Berlin";
  const WORK = "Alexanderplatz, Berlin";
  const FILES = {
    cafe: "Bäckerei & Café Liberda in Berlin-Kreuzberg (2024).jpg",
    cafe2: "Berlin, Kreuzberg, Oranienstraße 53–54, Café Moritzplatz.jpg",
    market: "Marheineke-Markthalle B-Kreuzberg 06-2017 img1.jpg",
    park: "Viktoriapark_B-Kreuzberg_06-2017_img1.jpg",
    street: "Kreuzberg Bergmannstraße Marheineke Markt.jpg",
    eat: "Berlin, Kreuzberg, Oranienstraße 53–54, Café Moritzplatz (2).jpg",
  };
  function filePath(key) {
    const n = FILES[key] || FILES.street;
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(n) + "?width=1200";
  }
  function $(s) { return document.querySelector(s); }
  function haversine(a, b) {
    const R = 6371000;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function walkMins(m) { return Math.max(1, Math.round(m / 80)); }

  async function geocode(q) {
    const res = await fetch(PHOTON + "?q=" + encodeURIComponent(q) + "&limit=5&lang=en");
    if (!res.ok) throw new Error("Address lookup failed");
    const data = await res.json();
    const f = (data.features || [])[0];
    if (!f) throw new Error("No match");
    const [lon, lat] = f.geometry.coordinates;
    const p = f.properties || {};
    return { lat: lat, lon: lon, label: p.name || [p.street, p.housenumber].filter(Boolean).join(" ") || q };
  }
  async function osrmRoute(from, to, profile) {
    const url = OSRM + "/" + (profile || "walking") + "/" + from.lon + "," + from.lat + ";" + to.lon + "," + to.lat + "?overview=full&geometries=geojson";
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
        id: "k3d", source: "openmaptiles", "source-layer": "building", type: "fill-extrusion", minzoom: 14,
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
    const map = new window.maplibregl.Map({
      container: id, style: STYLE, center: [center.lon, center.lat],
      zoom: 16.3, pitch: 56, bearing: -20, attributionControl: true,
    });
    map.on("load", function () { add3d(map); });
    return map;
  }
  function pin(map, ll, color, title) {
    const n = document.createElement("button");
    n.type = "button"; n.title = title || "";
    n.style.cssText = "width:14px;height:14px;border-radius:50% 50% 50% 0;background:" + color + ";transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.3);padding:0;cursor:pointer";
    return new window.maplibregl.Marker({ element: n }).setLngLat([ll.lon, ll.lat]).addTo(map);
  }
  function drawRoute(map, coords) {
    const geo = { type: "Feature", geometry: { type: "LineString", coordinates: coords } };
    if (map.getSource("trip")) { map.getSource("trip").setData(geo); return; }
    map.addSource("trip", { type: "geojson", data: geo });
    map.addLayer({ id: "trip-line", type: "line", source: "trip", paint: { "line-color": "#315d48", "line-width": 5 } });
  }
  function experience(map, coords) {
    if (!map || !coords || coords.length < 2) return;
    let i = 0;
    const step = Math.max(1, Math.floor(coords.length / 70));
    (function tick() {
      map.easeTo({ center: coords[i], zoom: 17.1, pitch: 62, duration: 220 });
      i += step;
      if (i < coords.length) setTimeout(tick, 170);
    })();
  }

  const COPY = [
    { id: "walk", h: "What does the walk around this home feel like?", p: "Explore the streets beyond the front door, then step inside a nearby place." },
    { id: "life", h: "What would life here look like for me?", p: "Answer a few questions, then see a neighborhood story shaped around them." },
    { id: "places", h: "Can I reach my everyday stops easily?", p: "Cafés, groceries, parks and gyms — and the walk from this door." },
    { id: "commute", h: "Would this commute work for me?", p: "Route from the listing to a workplace on the real street network." },
    { id: "day", h: "How would my usual day work here?", p: "Morning coffee, a park, dinner nearby." },
  ];

  const state = { map: null, cmap: null, home: null, places: [], markers: [], slide: 0, lastRoute: null, selected: null, household: {}, interests: {}, day: {} };

  function nearest(cat) {
    return state.places.filter(function (p) { return p.cat === cat; })[0];
  }
  function setCard(place, kicker) {
    const photo = $("#place-photo");
    if (place.photoUrl) { photo.hidden = false; photo.src = place.photoUrl; }
    else photo.hidden = true;
    $("#place-card .k").textContent = kicker || place.cat || "Place";
    $("#place-name").textContent = place.name || place.label;
    const bits = [];
    if (place.walk) bits.push(place.walk + " min walk");
    if (place.rating) bits.push("★ " + place.rating + " Google");
    $("#place-meta").textContent = bits.join(" · ") || "";
  }
  async function selectPlace(place) {
    if (!state.map || !state.home || !place) return;
    state.selected = place;
    setCard(place, place.cat);
    state.map.flyTo({ center: [place.lon, place.lat], zoom: 16.9, pitch: 60, speed: 0.75 });
    try {
      const r = await osrmRoute(state.home, place, "walking");
      drawRoute(state.map, r.coords);
      state.lastRoute = r.coords;
      $("#place-meta").textContent = r.mins + " min walk · " + (r.meters / 1000).toFixed(1) + " km" + (place.rating ? " · ★ " + place.rating + " Google" : "");
    } catch (_) {}
  }
  function clearMarkers() {
    state.markers.forEach(function (m) { m.remove(); });
    state.markers = [];
  }
  function showPins(filter) {
    if (!state.map || !state.home) return;
    clearMarkers();
    state.markers.push(pin(state.map, state.home, "#100d0c", state.home.label));
    const rows = state.places.filter(function (p) { return !filter || filter === "home" || p.cat === filter; });
    rows.slice(0, 14).forEach(function (p) {
      const col = p.cat === "coffee" ? "#c45c2d" : p.cat === "park" ? "#315d48" : "#100d0c";
      const m = pin(state.map, p, col, p.name);
      const html = "<div class='pop'><strong>" + p.name.replace(/</g, "") + "</strong>" +
        (p.rating ? "<div class='pop-stats'>★ " + p.rating + " Google</div>" : "") +
        "<p>" + (p.blurb || "") + "</p><small>" + p.walk + " min walk</small></div>";
      m.setPopup(new window.maplibregl.Popup({ offset: 16, maxWidth: "220px" }).setHTML(html));
      m.getElement().addEventListener("click", function () { selectPlace(p); });
      state.markers.push(m);
    });
  }
  function journeyPack(place) {
    const cat = (place && place.cat) || "coffee";
    const inside = cat === "grocery" ? "assets/img/enter/market-int.webp" : cat === "gym" ? "assets/img/enter/gym-int.webp" : "assets/img/enter/cafe-int.webp";
    return {
      street: { img: "assets/img/street-walk.webp", cap: "Outside the listing. Illustrative street — AI-generated." },
      walk: { img: null, cap: "Live walking route from the door." },
      arrive: { img: place && place.photoUrl, cap: "Arrive at " + (place && place.name ? place.name : "the place") + "." },
      inside: { img: inside, cap: "Illustrative interior — AI-generated; not a verified depiction of this venue." },
    };
  }
  function showJourneyStep(id) {
    const pack = state.journeyPack;
    if (!pack || !pack[id]) return;
    document.querySelectorAll("[data-j]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-j") === id); });
    const step = pack[id];
    const img = $("#j-img");
    $("#j-cap").textContent = step.cap;
    if (id === "walk") {
      img.hidden = true;
      $("#journey").style.background = "transparent";
      if (state.lastRoute) experience(state.map, state.lastRoute);
    } else {
      $("#journey").style.background = "#111";
      img.hidden = false;
      if (step.img) img.src = step.img;
    }
  }
  async function startJourney(place) {
    if (!place) return;
    await selectPlace(place);
    state.journeyPack = journeyPack(place);
    $("#journey").hidden = false;
    showJourneyStep("street");
  }
  function setSlide(i) {
    state.slide = i;
    document.querySelectorAll(".dots button").forEach(function (b, idx) { b.classList.toggle("on", idx === i); });
    document.querySelectorAll(".pane").forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== COPY[i].id; });
    $("#q-h").textContent = COPY[i].h;
    $("#q-p").textContent = COPY[i].p;
    if (i === 3 && state.cmap) {
      requestAnimationFrame(function () { state.cmap.resize(); ensureCommute(); });
    }
    if (i === 2) renderGallery("all");
  }
  function renderGallery(tab) {
    let rows = state.places.slice();
    if (tab && tab !== "all") rows = rows.filter(function (p) { return p.cat === tab; });
    if (!rows.length) return;
    const hero = rows[0];
    const hs = $("#hero-shot");
    hs.innerHTML = "<img alt=''><div class='cap'><h3></h3><p></p></div>";
    hs.querySelector("img").src = hero.photoUrl;
    hs.querySelector("h3").textContent = hero.name;
    hs.querySelector("p").textContent = (hero.walk ? hero.walk + " min" : "") + (hero.rating ? " · ★ " + hero.rating : "");
    hs.onclick = function () { if (hero.lat) selectPlace(hero); };
    const side = $("#sides");
    side.innerHTML = "";
    rows.slice(1, 4).forEach(function (p) {
      const el = document.createElement("button");
      el.className = "side-shot"; el.type = "button";
      el.innerHTML = "<img alt=''><span></span>";
      el.querySelector("img").src = p.photoUrl;
      el.querySelector("span").textContent = p.name;
      el.addEventListener("click", function () { selectPlace(p); });
      side.append(el);
    });
    document.querySelectorAll(".tabs button").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-tab") === tab); });
  }
  async function ensureCommute() {
    if (!state.home || !state.cmap) return;
    const q = ($("#work") && $("#work").value.trim()) || WORK;
    try {
      const to = await geocode(q);
      const r = await osrmRoute(state.home, to, "driving");
      drawRoute(state.cmap, r.coords);
      const b = new window.maplibregl.LngLatBounds();
      b.extend([state.home.lon, state.home.lat]); b.extend([to.lon, to.lat]);
      state.cmap.fitBounds(b, { padding: 70, pitch: 50, duration: 700 });
      pin(state.cmap, state.home, "#100d0c", "Home");
      pin(state.cmap, to, "#315d48", to.label);
      $("#c-min").textContent = r.mins + " min";
      $("#c-km").textContent = (r.meters / 1000).toFixed(1) + " km";
    } catch (_) { $("#c-min").textContent = "—"; }
  }
  function countSel(o) { return Object.keys(o).filter(function (k) { return o[k]; }).length; }
  function openPicker(slot) {
    const want = slot === "morning" ? "coffee" : slot === "afternoon" ? "park" : "eat";
    const rows = state.places.filter(function (p) { return p.cat === want; }).slice(0, 3);
    $("#picker").hidden = false;
    const row = $("#picker-row");
    row.innerHTML = "";
    rows.forEach(function (p) {
      const a = document.createElement("article");
      a.innerHTML = "<img alt=''><h4></h4><p></p>";
      a.querySelector("img").src = p.photoUrl;
      a.querySelector("h4").textContent = p.name;
      a.querySelector("p").textContent = p.walk + " min";
      a.addEventListener("click", function () {
        state.day[slot] = p;
        $("#picker").hidden = true;
        const el = document.querySelector('[data-slot="' + slot + '"]');
        el.innerHTML = "<img alt=''><h4></h4><p></p>";
        el.querySelector("img").src = p.photoUrl;
        el.querySelector("h4").textContent = p.name;
        el.querySelector("p").textContent = p.walk + " min";
        const n = ["morning", "afternoon", "evening"].filter(function (s) { return state.day[s]; }).length;
        $("#day-count").textContent = n + " of 3";
      });
      row.append(a);
    });
  }
  async function loadAddress(q) {
    const loader = $("#loader");
    if (loader) loader.hidden = false;
    try {
      const home = await geocode(q);
      state.home = home;
      $("#place-name").textContent = home.label;
      $("#feat-title").textContent = home.label;
      if (!state.map) state.map = makeMap("map", home);
      else state.map.flyTo({ center: [home.lon, home.lat], zoom: 16.3, pitch: 56, speed: 0.8 });
      if (!state.cmap) state.cmap = makeMap("c-map", home);
      setTimeout(function () { if (state.map) state.map.resize(); }, 60);
      const raw = await fetch("data/places.json").then(function (r) { return r.json(); });
      state.places = raw.map(function (p) {
        const dist = haversine(home, p);
        return Object.assign({}, p, { walk: walkMins(dist), photoUrl: filePath(p.photo) });
      }).sort(function (a, b) { return a.walk - b.walk; });
      showPins("home");
      const cafe = nearest("coffee");
      if (cafe) {
        $("#place-card .k").textContent = "Home";
        $("#place-meta").textContent = "Kreuzberg · nearest coffee " + cafe.walk + " min";
      }
      if (loader) loader.hidden = true;
    } catch (err) {
      if (loader) loader.hidden = true;
      alert(err.message || "Could not build this Kiez.");
    }
  }
  function wire() {
    document.querySelectorAll(".dots button").forEach(function (b, i) {
      b.addEventListener("click", function () { setSlide(i); });
    });
    $("#addr-form").addEventListener("submit", function (e) {
      e.preventDefault();
      loadAddress($("#address").value);
    });
    document.querySelectorAll("[data-fly]").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("[data-fly]").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        const cat = b.getAttribute("data-fly");
        showPins(cat);
        if (cat === "home" && state.home) {
          state.map.flyTo({ center: [state.home.lon, state.home.lat], zoom: 16.3, pitch: 56, speed: 0.8 });
          $("#place-card .k").textContent = "Home";
          $("#place-name").textContent = state.home.label;
          return;
        }
        const p = nearest(cat);
        if (p) selectPlace(p);
      });
    });
    $("#play-route").addEventListener("click", function () {
      startJourney(state.selected || nearest("coffee"));
    });
    document.querySelectorAll("[data-j]").forEach(function (b) {
      b.addEventListener("click", function () { showJourneyStep(b.getAttribute("data-j")); });
    });
    $("#j-close").addEventListener("click", function () { $("#journey").hidden = true; });
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
    $("#life-next").addEventListener("click", function () {
      $("#life-1").hidden = true; $("#life-2").hidden = false;
    });
    $("#life-build").addEventListener("click", function () {
      renderGallery(state.interests.coffee ? "coffee" : state.interests.dog ? "park" : "all");
      setSlide(2);
    });
    document.querySelectorAll(".tabs button").forEach(function (b) {
      b.addEventListener("click", function () { renderGallery(b.getAttribute("data-tab")); });
    });
    document.querySelectorAll("[data-slot]").forEach(function (el) {
      el.addEventListener("click", function () { openPicker(el.getAttribute("data-slot")); });
    });
    $("#see-day").addEventListener("click", function () {
      const seq = ["morning", "afternoon", "evening"].map(function (s) { return state.day[s]; }).filter(Boolean);
      if (!seq.length) return;
      document.querySelector(".hero").scrollIntoView({ behavior: "smooth" });
      selectPlace(seq[0]);
    });
    $("#work-form").addEventListener("submit", function (e) { e.preventDefault(); ensureCommute(); });
  }
  window.Kiez = {
    boot: async function () {
      wire();
      setSlide(0);
      $("#address").value = DEFAULT_Q;
      await loadAddress(DEFAULT_Q);
    },
  };
})();
