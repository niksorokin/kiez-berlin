/* Kiez — Berlin neighborhood tours. Independent of Mirai. */
(function () {
  const PHOTON = "https://photon.komoot.io/api/";
  const OVERPASS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  const OSRM = "https://router.project-osrm.org/route/v1";
  const STYLE = "https://tiles.openfreemap.org/styles/liberty";
  const DEFAULT_Q = "Bergmannstraße 25, 10961 Berlin";
  const PRESETS = [
    "Bergmannstraße 25, 10961 Berlin",
    "Kollwitzstraße 52, 10405 Berlin",
    "Savignyplatz 5, 10623 Berlin",
    "Oranienstraße 190, 10999 Berlin",
  ];

  const CATS = [
    { id: "home", label: "Home" },
    { id: "coffee", label: "Coffee" },
    { id: "grocery", label: "Grocery" },
    { id: "park", label: "Park" },
    { id: "eat", label: "Restaurant" },
  ];

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function haversine(a, b) {
    const R = 6371000;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  function walkMins(m) {
    return Math.max(1, Math.round(m / 80));
  }
  function encodeQuery(q) {
    return encodeURIComponent(q).replace(/%20/g, "+");
  }

  async function geocode(q) {
    const res = await fetch(PHOTON + "?q=" + encodeURIComponent(q) + "&limit=5&lang=en");
    if (!res.ok) throw new Error("Address lookup failed");
    const data = await res.json();
    const f = (data.features || [])[0];
    if (!f) throw new Error("No match for that address");
    const [lon, lat] = f.geometry.coordinates;
    const p = f.properties || {};
    const city = p.city || p.town || p.village || "";
    const label = p.name || [p.street, p.housenumber].filter(Boolean).join(" ") || q;
    const display = [label, p.district, city, p.country].filter(Boolean).join(", ");
    return { lat, lon, label, display, city, raw: p };
  }

  function overpassQuery(lat, lon) {
    return `[out:json][timeout:25];
(
  nwr(around:1100,${lat},${lon})[amenity~"cafe|restaurant|fast_food|bar"];
  nwr(around:1100,${lat},${lon})[shop~"supermarket|convenience|greengrocer|bakery|coffee"];
  nwr(around:1100,${lat},${lon})[leisure~"park|garden|playground"];
);
out center 80;`;
  }

  function nodeCenter(e) {
    if (e.type === "node") return { lat: e.lat, lon: e.lon };
    if (e.center) return { lat: e.center.lat, lon: e.center.lon };
    return null;
  }
  function catOf(t) {
    if (t.amenity === "cafe" || t.shop === "coffee") return "coffee";
    if (["supermarket", "convenience", "greengrocer", "bakery"].indexOf(t.shop) >= 0) return "grocery";
    if (t.leisure === "park" || t.leisure === "garden" || t.leisure === "playground") return "park";
    if (t.amenity === "restaurant" || t.amenity === "fast_food" || t.amenity === "bar") return "eat";
    return null;
  }

  async function fetchPois(home) {
    const body = "data=" + encodeURIComponent(overpassQuery(home.lat, home.lon));
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
          out.push({
            id: String(e.id),
            name: tags.name,
            cat: cat,
            lat: c.lat,
            lon: c.lon,
            dist: dist,
            walk: walkMins(dist),
            tags: tags,
          });
        });
        out.sort(function (a, b) {
          return a.dist - b.dist;
        });
        return out.slice(0, 50);
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
    return {
      coords: r.geometry.coordinates,
      meters: r.distance,
      mins: Math.max(1, Math.round(r.duration / 60)),
    };
  }

  function add3d(map) {
    if (map.getLayer("kiez-3d")) return;
    try {
      map.addLayer({
        id: "kiez-3d",
        source: "openmaptiles",
        "source-layer": "building",
        type: "fill-extrusion",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": "#d9d2c5",
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 10],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.7,
        },
      });
    } catch (_) {}
  }

  function makeMap(container, center) {
    const ml = window.maplibregl;
    const map = new ml.Map({
      container: container,
      style: STYLE,
      center: [center.lon, center.lat],
      zoom: 16,
      pitch: 58,
      bearing: -22,
      attributionControl: true,
    });
    map.addControl(new ml.NavigationControl({ visualizePitch: true }), "bottom-right");
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
      ";transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.25)";
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
      paint: { "line-color": "#100d0c", "line-width": 4, "line-opacity": 0.85 },
    });
  }

  function setStages(i) {
    document.querySelectorAll(".loader li").forEach(function (li, idx) {
      li.classList.toggle("on", idx === i);
      li.classList.toggle("done", idx < i);
    });
  }

  function showLoader(on) {
    const el = $("#loader");
    if (el) el.hidden = !on;
  }

  const state = {
    map: null,
    home: null,
    places: [],
    markers: [],
    cat: "home",
  };

  function clearMarkers() {
    state.markers.forEach(function (m) {
      m.remove();
    });
    state.markers = [];
  }

  function setCard(title, meta, kicker) {
    const card = $("#place-card");
    if (!card) return;
    card.querySelector(".k").textContent = kicker || "Place";
    card.querySelector("h3").textContent = title;
    card.querySelector("p").textContent = meta;
  }

  async function selectPlace(place) {
    if (!state.map || !state.home) return;
    state.map.flyTo({ center: [place.lon, place.lat], zoom: 16.4, pitch: 60, speed: 0.8 });
    setCard(place.name, "Timing the walk…", CATS.filter(function (c) { return c.id === place.cat; })[0].label);
    try {
      const r = await osrmRoute(state.home, place, "walking");
      drawRoute(state.map, r.coords);
      setCard(place.name, r.mins + " min walk · " + (r.meters / 1000).toFixed(1) + " km", "From the listing");
      const play = $("#play-route");
      if (play) play.onclick = function () { experience(r.coords); };
    } catch (_) {
      drawRoute(state.map, [
        [state.home.lon, state.home.lat],
        [place.lon, place.lat],
      ]);
      setCard(place.name, "About " + place.walk + " min walk", "From the listing");
    }
  }

  function experience(coords) {
    if (!coords || coords.length < 2 || !state.map) return;
    let i = 0;
    const step = Math.max(1, Math.floor(coords.length / 70));
    function tick() {
      const c = coords[i];
      state.map.easeTo({ center: c, zoom: 17, pitch: 62, bearing: -22 + i * 0.3, duration: 260 });
      i += step;
      if (i < coords.length) setTimeout(tick, 200);
    }
    tick();
  }

  function renderCat(id) {
    state.cat = id;
    document.querySelectorAll(".cat").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-cat") === id ? "true" : "false");
    });
    clearMarkers();
    if (!state.map || !state.home) return;
    state.markers.push(pin(state.map, state.home, "#100d0c", state.home.label));
    if (id === "home") {
      state.map.flyTo({ center: [state.home.lon, state.home.lat], zoom: 16, pitch: 58, speed: 0.7 });
      setCard(state.home.label, state.home.display, "Home");
      return;
    }
    const rows = state.places.filter(function (p) {
      return p.cat === id;
    });
    rows.slice(0, 24).forEach(function (p) {
      const m = pin(state.map, p, "#c45c2d", p.name);
      m.getElement().style.cursor = "pointer";
      m.getElement().addEventListener("click", function () {
        selectPlace(p);
      });
      state.markers.push(m);
    });
    if (rows[0]) selectPlace(rows[0]);
    else setCard("Nothing mapped yet", "OSM is thin in this category here.", CATS.filter(function (c) { return c.id === id; })[0].label);
  }

  async function loadAddress(q) {
    const query = (q || "").trim();
    if (!query) return;
    showLoader(true);
    setStages(0);
    const status = $("#status");
    if (status) status.textContent = "";
    try {
      const home = await geocode(query);
      state.home = home;
      setStages(1);
      if (!state.map) {
        state.map = makeMap("map", home);
        if (!state.map.loaded()) {
          await new Promise(function (resolve) {
            state.map.once("load", resolve);
          });
        }
      } else {
        state.map.flyTo({ center: [home.lon, home.lat], zoom: 16, pitch: 58, speed: 0.8 });
        if (state.map.loaded()) add3d(state.map);
      }
      const listing = $("#listing-name");
      if (listing) listing.textContent = home.label;
      renderCat("home");
      const dir = location.pathname.replace(/[^/]+$/, "") || "/";
      state.shareUrl = location.origin + dir + "tour.html?q=" + encodeQuery(home.display || query);
      setStages(2);
      showLoader(false);
      try {
        state.places = await fetchPois(home);
        setStages(3);
        if (state.cat !== "home") renderCat(state.cat);
      } catch (e) {
        state.places = [];
        if (status) status.textContent = "Places layer is thin — the map still works.";
      }
    } catch (err) {
      showLoader(false);
      if (status) status.textContent = err.message || "Could not build this Kiez.";
      else alert(err.message || "Could not build this Kiez.");
    }
  }

  function wire() {
    const form = $("#addr-form");
    const input = $("#address");
    if (input && !input.value) input.value = DEFAULT_Q;
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        loadAddress(input.value);
      });
    }
    document.querySelectorAll(".preset").forEach(function (b) {
      b.addEventListener("click", function () {
        if (input) input.value = b.getAttribute("data-q");
        loadAddress(b.getAttribute("data-q"));
      });
    });
    document.querySelectorAll(".cat").forEach(function (b) {
      b.addEventListener("click", function () {
        renderCat(b.getAttribute("data-cat"));
      });
    });
    const commute = $("#commute-form");
    if (commute) {
      commute.addEventListener("submit", async function (e) {
        e.preventDefault();
        const dest = $("#commute").value.trim();
        if (!dest || !state.home) return;
        $("#status").textContent = "Timing commute…";
        try {
          const to = await geocode(dest);
          const mode = $("#mode").value;
          const r = await osrmRoute(state.home, to, mode === "walk" ? "walking" : "driving");
          drawRoute(state.map, r.coords);
          const b = new window.maplibregl.LngLatBounds();
          b.extend([state.home.lon, state.home.lat]);
          b.extend([to.lon, to.lat]);
          state.map.fitBounds(b, { padding: 80, pitch: 45, duration: 800 });
          setCard("Commute", r.mins + " min " + (mode === "walk" ? "walk" : "drive") + " to " + to.label, "Workplace");
          $("#play-route").onclick = function () {
            experience(r.coords);
          };
          $("#status").textContent = "";
        } catch (_) {
          $("#status").textContent = "Could not time that commute.";
        }
      });
    }
    const share = $("#share");
    if (share) {
      share.addEventListener("click", function () {
        const url = state.shareUrl || location.href;
        $("#share-modal").hidden = false;
        $("#share-url").value = url;
        $("#qr").src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(url);
        $("#embed").value =
          '<iframe src="' + url + '" title="Kiez neighborhood tour" width="100%" height="640" style="border:0"></iframe>';
      });
    }
    const copy = $("#copy-link");
    if (copy) {
      copy.addEventListener("click", async function () {
        try {
          await navigator.clipboard.writeText($("#share-url").value);
          copy.textContent = "Copied";
        } catch (_) {
          $("#share-url").select();
        }
      });
    }
    const close = $("#close-share");
    if (close) close.addEventListener("click", function () {
      $("#share-modal").hidden = true;
    });
    const signin = $("#signin");
    if (signin) {
      signin.addEventListener("click", function (e) {
        e.preventDefault();
      });
    }
  }

  async function boot() {
    wire();
    const params = new URLSearchParams(location.search);
    const q = (params.get("q") || DEFAULT_Q).trim();
    const input = $("#address");
    if (input) input.value = q;
    await loadAddress(q);
  }

  window.Kiez = { boot: boot, PRESETS: PRESETS, DEFAULT_Q: DEFAULT_Q };
})();
