#!/usr/bin/env node
"use strict";

/*
 * WebMap micro-server — tanpa dependency (hanya built-in Node.js).
 *
 *   STATIC  : serve file dari folder proyek + gzip + ETag/cache header.
 *   API     : GET /api/health, /api/locations, /api/kpi
 *   LIVE    : GET /api/stream (Server-Sent Events) untuk grafik real-time.
 *
 * Jalankan:  PORT=8000 node server.js
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8000);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2"
};

/* Data contoh yang sama dengan fallback di js/map.js dan KPI di index.html. */
const LOCATIONS = [
  { id: "jakarta", nama: "Jakarta Pusat", lat: -6.2088, lon: 106.8456, tag: "Kantor Pusat", users: 38, trend: 12.4 },
  { id: "bandung", nama: "Bandung", lat: -6.9175, lon: 107.6191, tag: "R&D", users: 21, trend: 8.1 },
  { id: "yogyakarta", nama: "Yogyakarta", lat: -7.7971, lon: 110.3708, tag: "Kampus", users: 15, trend: -2.3 },
  { id: "surabaya", nama: "Surabaya", lat: -7.2575, lon: 112.7521, tag: "Sales", users: 18, trend: 5.9 },
  { id: "makassar", nama: "Makassar", lat: -5.1477, lon: 119.4327, tag: "Summit", users: 8, trend: 9.7 }
];

const KPI = { pengunjung: 128400, transaksi: 38920, bounce: 31, load: 0.8 };

const clients = new Set();
const LIVE = { value: 62 };

function nextLive() {
  LIVE.value += (Math.random() - 0.48) * 8;
  LIVE.value = Math.max(20, Math.min(100, LIVE.value));
  return Math.round(LIVE.value * 10) / 10;
}

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(body);
}

function toSafePath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch (e) {
    return null;
  }
  const full = path.normalize(path.join(ROOT, decoded));
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) return null;
  return full;
}

function serveStatic(req, res, pathname) {
  const full = toSafePath(pathname);
  if (!full) return sendJSON(res, 400, { error: "path tidak valid" });

  fs.stat(full, (statErr, st) => {
    if (statErr || !st.isFile()) {
      return sendJSON(res, 404, { error: "404 — file tidak ditemukan: " + pathname });
    }

    const etag = '"' + st.mtimeMs.toString(36) + "-" + st.size.toString(36) + '"';
    if (req.headers["if-none-match"] === etag) {
      res.writeHead(304, { ETag: etag });
      return res.end();
    }

    const type = MIME[path.extname(full).toLowerCase()] || "application/octet-stream";
    const isHead = req.method === "HEAD";
    const acceptGzip = /\bgzip\b/.test(req.headers["accept-encoding"] || "");
    const headers = {
      "Content-Type": type,
      "Cache-Control": path.extname(full) === ".html" ? "no-cache" : "public, max-age=600",
      ETag: etag
    };

    if (acceptGzip && !isHead) headers["Content-Encoding"] = "gzip";
    res.writeHead(200, headers);
    if (isHead) return res.end();

    const stream = fs.createReadStream(full);
    res.on("close", () => stream.destroy());
    if (acceptGzip) {
      stream.pipe(zlib.createGzip()).pipe(res);
    } else {
      stream.pipe(res);
    }
  });
}

function handleSSE(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-store",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
    "Access-Control-Allow-Origin": "*"
  });
  res.write("retry: 3000\n\n");
  res.write("data: " + JSON.stringify({ t: Date.now(), value: nextLive() }) + "\n\n");
  clients.add(res);
  req.on("close", function () {
    clients.delete(res);
    res.end();
  });
}

setInterval(function () {
  const payload = "data: " + JSON.stringify({ t: Date.now(), value: nextLive() }) + "\n\n";
  clients.forEach(function (c) {
    try {
      c.write(payload);
    } catch (e) {
      clients.delete(c);
    }
  });
}, 2000);

setInterval(function () {
  clients.forEach(function (c) {
    try {
      c.write(": hb " + Date.now() + "\n\n");
    } catch (e) {
      clients.delete(c);
    }
  });
}, 25000);

function route(req, res) {
  let url;
  try {
    url = new URL(req.url, "http://localhost");
  } catch (e) {
    return sendJSON(res, 400, { error: "URL tidak valid" });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendJSON(res, 405, { error: "metode tidak diizinkan" });
  }

  const p = url.pathname;

  if (p === "/api/health") {
    return sendJSON(res, 200, {
      status: "ok",
      uptime: Math.round(process.uptime()),
      clients: clients.size,
      ts: new Date().toISOString()
    });
  }
  if (p === "/api/locations") {
    return sendJSON(res, 200, {
      source: "webmap-server",
      updated: new Date().toISOString(),
      total: LOCATIONS.length,
      locations: LOCATIONS
    });
  }
  if (p === "/api/kpi") {
    return sendJSON(res, 200, {
      source: "webmap-server",
      updated: new Date().toISOString(),
      kpi: KPI
    });
  }
  if (p === "/api/stream") {
    return handleSSE(req, res);
  }
  if (p.startsWith("/api/")) {
    return sendJSON(res, 404, { error: "endpoint tidak dikenal" });
  }

  let pathname = p;
  if (pathname === "/") pathname = "/index.html";
  return serveStatic(req, res, pathname);
}

const server = http.createServer(route);

server.listen(PORT, function () {
  console.log("WebMap server aktif → http://localhost:" + PORT);
  console.log("  API  : /api/health /api/locations /api/kpi");
  console.log("  LIVE : /api/stream (SSE) · klien SSE = " + clients.size);
});

process.on("SIGINT", function () {
  clients.forEach(function (c) {
    try { c.end(); } catch (e) {}
  });
  server.close(function () { process.exit(0); });
});