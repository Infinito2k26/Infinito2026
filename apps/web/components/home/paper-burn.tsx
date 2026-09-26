"use client";

import { useEffect, useRef } from "react";
import { PAPER_COLOR, PAPER_GRAIN } from "@/components/home/paper";
import { throwSparks } from "@/components/home/sparks";

/**
 * Burns a paper card on hover, outward from the point where the pointer came
 * in, the way paper really burns: it browns ahead of the fire, chars black,
 * burns along a thin, broken, flickering ember edge, and then is simply gone —
 * showing whatever sits beneath it in the card.
 *
 * How it works:
 * 1. Compose. The paper is painted once into an offscreen 2D canvas from the
 *    real DOM paper (`[data-paper]` in the parent): the grain, the printed
 *    poster (`img`) and every `[data-print]` element's text, drawn with its own
 *    computed font, colour, border and transform. The DOM paper is then hidden
 *    and this canvas takes its place, so the swap is invisible.
 * 2. Burn map. When each point of the sheet catches: its distance from the
 *    ignition point, domain-warped by fractal noise so the fire runs unevenly,
 *    in a small texture. The noise — the expensive part — is computed once per
 *    sheet, in an idle moment; each fresh hover re-derives the map from where
 *    the pointer entered (one square root per texel). Keyboard focus lights
 *    it near the middle.
 * 3. Burn. Per frame, a tiny fragment shader compares that map with the
 *    advancing front — two texture reads and a little arithmetic per pixel.
 *
 * One WebGL context burns every card on the page. Browsers keep only about
 * sixteen alive at once (open another and the oldest is lost), and a wall of
 * bills can hold more cards than that. So each card's own canvas is a plain
 * 2D one: at rest it shows the composed sheet; while the card burns or
 * restores, the shared context renders the frame and the card copies it
 * across. A card only takes textures in that context once it's first hovered.
 *
 * While it spreads, the burning edge throws sparks and burning scraps into
 * the page's ember layer (AshEmbers, if it's on): each one leaves from a
 * texel of the map that is catching right now.
 *
 * The loop only runs while the burn moves (or flickers on a burnt card). No
 * hover-capable pointer, no WebGL or reduced motion: it never starts, and the
 * DOM paper stays as it is.
 */

const VERT = `
attribute vec2 p;
varying vec2 uv;
void main() {
  uv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 uv;
uniform sampler2D paper;
uniform sampler2D map;
uniform float front;
uniform float t;
uniform vec2 res;
// The map runs 0 → 1 over however far the fire has to go. k rescales it so
// the toasting, char and ember bands keep the same width on the sheet whether
// the fire starts in the middle or in a corner.
uniform float k;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec2 st = vec2(uv.x, 1.0 - uv.y);
  vec2 px = st * res;
  vec4 P = texture2D(paper, st);
  float b = texture2D(map, st).r;

  // Pixel-scale roughness on the front, so the edge is fibrous, not smooth.
  float fine = noise(px / 5.0) * 0.6 + noise(px / 2.2) * 0.4;
  float e = (b - front) * k + (fine - 0.5) * 0.028;
  if (e < -0.004) { gl_FragColor = vec4(0.0); return; }

  vec3 c = P.rgb;
  // Toasting: the paper browns well ahead of the flame.
  c *= mix(vec3(1.0), vec3(0.74, 0.5, 0.28), smoothstep(0.17, 0.045, e));
  // Charring: brown-black, then black ash at the very edge.
  c = mix(c, vec3(0.1, 0.055, 0.035), smoothstep(0.065, 0.014, e));
  c = mix(c, vec3(0.035, 0.022, 0.018), smoothstep(0.022, 0.005, e));

  // The burning edge: thin, broken into glowing runs, flickering.
  float runs = smoothstep(0.22, 0.62, noise(px / 16.0 + vec2(t * 1.3, -t * 0.7)));
  float edge = smoothstep(0.02, 0.0, e) * runs;
  vec3 ember = mix(vec3(0.75, 0.16, 0.05), vec3(1.0, 0.62, 0.25), smoothstep(0.016, 0.004, e));
  ember = mix(ember, vec3(1.0, 0.9, 0.7), smoothstep(0.005, 0.0, e));
  c += ember * edge * (0.9 + 0.5 * noise(px / 3.0 + t * 9.0));
  // Heat glow bleeding just ahead of the edge.
  c += vec3(0.55, 0.16, 0.04) * smoothstep(0.045, 0.0, e) * runs * 0.35;

  // Stray sparks still glowing in the char.
  float speck = step(0.94, noise(px / 2.6)) * smoothstep(0.05, 0.012, e);
  c += vec3(1.0, 0.48, 0.14) * speck * (0.5 + 0.5 * sin(t * 8.0 + b * 90.0));

  float a = smoothstep(-0.004, 0.004, e) * P.a;
  gl_FragColor = vec4(c * a, a);
}`;

const FROM = -0.01;
const TO = 1.03; // burns out to a few charred fibres at the very edges
const IN = 1.4; // seconds to burn through
const OUT = 0.55; // seconds to restore
const SPARKS = 24; // per second, from the edge while it spreads

// --- CPU noise for the burn map -------------------------------------------

function makeNoise(seed: number) {
  const hash = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7 + seed * 17.13) * 43758.5453;
    return s - Math.floor(s);
  };
  const noise = (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy);
    const b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1);
    const d = hash(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };
  return (x: number, y: number) => {
    let v = 0;
    let amp = 0.5;
    for (let o = 0; o < 4; o++) {
      v += amp * noise(x, y);
      x = x * 2.03 + 11.7;
      y = y * 2.03 + 5.3;
      amp *= 0.5;
    }
    return v;
  };
}

type Field = {
  mw: number;
  mh: number;
  aspect: number;
  wx: Float32Array;
  wy: Float32Array;
  delay: Float32Array;
  raw: Float32Array;
  out: Uint8Array;
};

/**
 * The part of the burn map that doesn't depend on where the fire starts: each
 * texel's position after domain warping (the fire runs faster along some
 * fibres than others) and a patchy extra delay. Units: x across 0…aspect,
 * y down 0…1. Computed once per sheet — this is where the noise cost is.
 */
function burnField(w: number, h: number): Field {
  const mw = 128;
  const mh = Math.max(16, Math.round((mw * h) / w));
  const aspect = w / h;
  const fbm = makeNoise(Math.random() * 100);
  const n = mw * mh;
  const wx = new Float32Array(n);
  const wy = new Float32Array(n);
  const delay = new Float32Array(n);
  for (let j = 0; j < mh; j++) {
    for (let i = 0; i < mw; i++) {
      const x = (i / (mw - 1)) * aspect;
      const y = j / (mh - 1);
      const k = j * mw + i;
      wx[k] = x + 0.32 * (fbm(x * 2.2, y * 2.2) - 0.5);
      wy[k] = y + 0.32 * (fbm(x * 2.2 + 9.1, y * 2.2 + 3.7) - 0.5);
      delay[k] = 0.22 * fbm(x * 4.5 + 3.3, y * 4.5 + 7.1);
    }
  }
  return { mw, mh, aspect, wx, wy, delay, raw: new Float32Array(n), out: new Uint8Array(n) };
}

/**
 * When each point catches for a fire lit at (ox, oy) in field units, into
 * `f.out` as 8-bit luminance: 0 first, 255 last. Returns the span of catch
 * distances — how far the fire has to run.
 */
function ignite(f: Field, ox: number, oy: number) {
  const { wx, wy, delay, raw, out } = f;
  let lo = Infinity;
  let hi = -Infinity;
  for (let k = 0; k < raw.length; k++) {
    const dx = wx[k]! - ox;
    const dy = wy[k]! - oy;
    const v = Math.sqrt(dx * dx + dy * dy) + delay[k]!;
    raw[k] = v;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const to8 = 255 / (hi - lo);
  for (let k = 0; k < raw.length; k++) out[k] = Math.round((raw[k]! - lo) * to8);
  return hi - lo;
}

// --- Compose the paper from the DOM ----------------------------------------

let grain: Promise<HTMLImageElement> | null = null;
function loadGrain() {
  grain ??= new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = PAPER_GRAIN;
  });
  return grain;
}

/** The lines the browser broke an element's text into: each line's words,
 *  and where its first word's box sits in the viewport. */
function printedLines(el: HTMLElement, upper: boolean) {
  const lines: { text: string; left: number; top: number }[] = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    for (const word of (node.nodeValue ?? "").matchAll(/\S+/g)) {
      range.setStart(node, word.index);
      range.setEnd(node, word.index + word[0].length);
      const r = range.getBoundingClientRect();
      if (!r.width) continue;
      const text = upper ? word[0].toUpperCase() : word[0];
      const line = lines.find((l) => Math.abs(l.top - r.top) < r.height / 2);
      if (line) line.text += ` ${text}`;
      else lines.push({ text, left: r.left, top: r.top });
    }
  }
  return lines;
}

async function compose(paperEl: HTMLElement, scale: number) {
  const box = paperEl.getBoundingClientRect();
  const w = paperEl.offsetWidth;
  const h = paperEl.offsetHeight;
  const sx = w / box.width || 1; // undo any transform on the card (hover lift, reveal)
  const c = document.createElement("canvas");
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);

  // Paper and grain.
  ctx.fillStyle = PAPER_COLOR;
  ctx.fillRect(0, 0, w, h);
  const g = await loadGrain().catch(() => null);
  if (g) {
    ctx.fillStyle = ctx.createPattern(g, "repeat")!;
    ctx.fillRect(0, 0, w, h);
  }

  // The printed poster: object-fit cover, anchored top, faded out at the
  // bottom, multiplied into the paper like ink.
  const img = paperEl.querySelector("img");
  if (img && img.complete && img.naturalWidth) {
    const r = img.getBoundingClientRect();
    const iw = r.width * sx;
    const ih = r.height * sx;
    const ix = (r.left - box.left) * sx;
    const iy = (r.top - box.top) * sx;
    const k = Math.max(iw / img.naturalWidth, ih / img.naturalHeight);
    const dw = img.naturalWidth * k;
    const dh = img.naturalHeight * k;
    const off = document.createElement("canvas");
    off.width = Math.round(iw * scale);
    off.height = Math.round(ih * scale);
    const o = off.getContext("2d")!;
    o.scale(scale, scale);
    o.filter = getComputedStyle(img).filter === "none" ? "none" : getComputedStyle(img).filter;
    o.drawImage(img, (iw - dw) / 2, 0, dw, dh);
    o.filter = "none";
    const fade = o.createLinearGradient(0, 0, 0, ih);
    fade.addColorStop(0.62, "rgba(0,0,0,1)");
    fade.addColorStop(1, "rgba(0,0,0,0)");
    o.globalCompositeOperation = "destination-in";
    o.fillStyle = fade;
    o.fillRect(0, 0, iw, ih);
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(off, ix, iy, iw, ih);
    ctx.globalCompositeOperation = "source-over";
  }

  // Aged edges.
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.translate(w / 2, h / 2);
  ctx.scale(1, h / w);
  const vg = ctx.createRadialGradient(0, 0, w * 0.3, 0, 0, w * 0.78);
  vg.addColorStop(0, "rgba(255,255,255,0)");
  vg.addColorStop(1, "rgba(150,100,55,0.55)");
  ctx.fillStyle = vg;
  ctx.fillRect(-w, -w, w * 2, w * 2);
  ctx.restore();

  // Printed text, each element drawn with its own computed styles.
  for (const el of paperEl.querySelectorAll<HTMLElement>("[data-print]")) {
    const cs = getComputedStyle(el);
    const upper = cs.textTransform === "uppercase";
    ctx.save();
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
    ctx.fillStyle = cs.color;
    ctx.globalAlpha = parseFloat(cs.opacity) || 1;
    ctx.textBaseline = "alphabetic";

    if (cs.transform && cs.transform !== "none") {
      // A stamp, set at an angle: one word in a ruled box, drawn in its own
      // turned frame about its centre.
      const r = el.getBoundingClientRect();
      const ew = el.offsetWidth;
      const eh = el.offsetHeight;
      const m = new DOMMatrix(cs.transform);
      ctx.translate((r.left + r.width / 2 - box.left) * sx, (r.top + r.height / 2 - box.top) * sx);
      ctx.transform(m.a, m.b, m.c, m.d, 0, 0);
      ctx.translate(-ew / 2, -eh / 2);
      const bw = parseFloat(cs.borderTopWidth) || 0;
      if (bw) {
        ctx.strokeStyle = cs.borderTopColor;
        ctx.lineWidth = bw;
        ctx.strokeRect(bw / 2, bw / 2, ew - bw, eh - bw);
      }
      const text = upper ? el.textContent!.toUpperCase() : el.textContent!;
      const tm = ctx.measureText(text);
      const asc = tm.fontBoundingBoxAscent;
      const padT = parseFloat(cs.paddingTop) + bw;
      const inner = eh - padT - parseFloat(cs.paddingBottom) - bw;
      ctx.fillText(text, parseFloat(cs.paddingLeft) + bw, padT + (inner - (asc + tm.fontBoundingBoxDescent)) / 2 + asc);
    } else {
      // Set straight: line by line, wherever the browser broke it.
      const asc = ctx.measureText("H").fontBoundingBoxAscent;
      for (const line of printedLines(el, upper)) {
        ctx.fillText(line.text, (line.left - box.left) * sx, (line.top - box.top) * sx + asc);
      }
    }
    ctx.restore();
  }
  return c;
}

// --- The shared context -----------------------------------------------------

type Burner = {
  gl: WebGLRenderingContext;
  canvas: HTMLCanvasElement;
  u: Record<"paper" | "map" | "front" | "t" | "res" | "k", WebGLUniformLocation | null>;
  /** Which context this is: a lost one is replaced, and the textures made in
   *  it are gone with it. */
  gen: number;
};

let shared: Burner | null = null;
let generation = 0;
let unsupported = false;

/** The page's one burning context, made on first use (null: no WebGL). */
function burner(): Burner | null {
  if (shared || unsupported) return shared;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) {
    unsupported = true;
    return null;
  }
  const sh = (type: number, src: string) => {
    const x = gl.createShader(type)!;
    gl.shaderSource(x, src);
    gl.compileShader(x);
    return x;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    unsupported = true;
    return null;
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(
    ["paper", "map", "front", "t", "res", "k"].map((n) => [n, gl.getUniformLocation(prog, n)]),
  ) as Burner["u"];
  gl.uniform1i(u.paper, 0);
  gl.uniform1i(u.map, 1);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    shared = null;
  });
  shared = { gl, canvas, u, gen: ++generation };
  return shared;
}

function texture(gl: WebGLRenderingContext) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

/** Resolves in an idle moment (or after `timeout` ms at the latest), so a
 *  wall of cards coming into view builds its sheets between frames. */
function idle(timeout = 250) {
  return new Promise<void>((resolve) => {
    if ("requestIdleCallback" in window) requestIdleCallback(() => resolve(), { timeout });
    else setTimeout(resolve, 16);
  });
}

export default function PaperBurn({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const paperEl = host?.querySelector<HTMLElement>("[data-paper]");
    const view = canvas?.getContext("2d");
    if (!canvas || !host || !paperEl || !view) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    // This card's sheet and burn map, and its textures in the shared context
    // (made on first burn; `texGen` says which context they belong to).
    let sheet: HTMLCanvasElement | null = null;
    let field: Field | null = null;
    let paperTex: WebGLTexture | null = null;
    let mapTex: WebGLTexture | null = null;
    let texGen = 0;
    let paperDirty = true;
    let mapDirty = true;
    let raf = 0;
    let s = 0;
    let hot = false;
    // Where the current fire was lit, as fractions of the sheet (null: near
    // the middle). spanRef is a middle fire's span; `dur` is this fire's burn
    // time, stretched a little when it has further to go; `k` keeps its
    // bands the same width on the sheet (see the shader).
    let origin: [number, number] | null = null;
    let spanRef = 1;
    let dur = IN;
    let k = 1;
    let sparkDue = 0;
    let last = 0;
    let ready = false;
    let building = false;
    let disposed = false;

    // The sheet at rest, exactly as composed.
    const rest = () => {
      if (!sheet) return;
      view.clearRect(0, 0, canvas.width, canvas.height);
      view.drawImage(sheet, 0, 0);
    };

    // One frame of the fire, rendered in the shared context and copied here.
    const render = (now: number, front: number) => {
      const b = burner();
      if (!b || !sheet || !field) return;
      const { gl, canvas: out, u } = b;
      if (texGen !== b.gen) {
        paperTex = texture(gl);
        mapTex = texture(gl);
        texGen = b.gen;
        paperDirty = mapDirty = true;
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, paperTex);
      if (paperDirty) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sheet);
        paperDirty = false;
      }
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, mapTex);
      if (mapDirty) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, field.mw, field.mh, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, field.out);
        mapDirty = false;
      }
      const w = sheet.width;
      const h = sheet.height;
      // Grown to the largest card it has drawn; each draws in its corner.
      if (out.width < w || out.height < h) {
        out.width = Math.max(out.width, w);
        out.height = Math.max(out.height, h);
      }
      gl.viewport(0, 0, w, h);
      gl.uniform1f(u.front, front);
      gl.uniform1f(u.t, now / 1000);
      gl.uniform2f(u.res, w, h);
      gl.uniform1f(u.k, k);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      // The viewport is the bottom-left of the drawing buffer, which is the
      // bottom-left of the canvas as an image.
      view.clearRect(0, 0, w, h);
      view.drawImage(out, 0, out.height - h, w, h, 0, 0, w, h);
    };

    // Lights the map at `at` (fractions of the sheet), or near the middle.
    const light = (at: [number, number] | null) => {
      if (!field) return;
      const ox = at ? at[0] * field.aspect : (0.5 + (Math.random() - 0.5) * 0.12) * field.aspect;
      const oy = at ? at[1] : 0.46 + (Math.random() - 0.5) * 0.12;
      const span = ignite(field, ox, oy);
      k = spanRef / span;
      // From a corner the fire has about twice as far to go: give it a bit
      // longer, so it doesn't look like it's racing.
      dur = IN * Math.sqrt(span / spanRef);
      mapDirty = true;
    };

    const build = async (urgent = false) => {
      if (building || disposed) return;
      building = true;
      await document.fonts.ready;
      const img = paperEl.querySelector("img");
      if (img && !img.complete) {
        await new Promise((r) => {
          img.addEventListener("load", r, { once: true });
          img.addEventListener("error", r, { once: true });
        });
      }
      if (!urgent) await idle();
      const w = paperEl.offsetWidth;
      const h = paperEl.offsetHeight;
      if (disposed || !w || !h || !burner()) {
        building = false;
        return;
      }
      const scale = Math.min(window.devicePixelRatio || 1, 1.5);
      const composed = await compose(paperEl, scale);
      const f = burnField(w, h);
      spanRef = ignite(f, 0.5 * f.aspect, 0.46);
      if (disposed) return;
      sheet = composed;
      field = f;
      paperDirty = true;
      light(origin);
      canvas.width = sheet.width;
      canvas.height = sheet.height;
      rest();
      ready = true;
      building = false;
      host.setAttribute("data-paper-ready", "");
      if (hot || s > 0) kick();
    };

    // A spark from the burning edge: a random texel of the map whose catch
    // time is about now.
    const sparkFromEdge = (front: number) => {
      if (!field) return;
      const { out, mw, mh } = field;
      const target = front * 255;
      for (let tries = 0; tries < 40; tries++) {
        const i = (Math.random() * out.length) | 0;
        if (Math.abs(out[i]! - target) < 7) {
          const r = canvas.getBoundingClientRect();
          throwSparks({
            x: r.left + ((i % mw) / (mw - 1)) * r.width,
            y: r.top + (Math.floor(i / mw) / (mh - 1)) * r.height,
            scraps: 0.3,
          });
          return;
        }
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s = hot ? Math.min(1, s + dt / dur) : Math.max(0, s - dt / OUT);
      if (s === 0) {
        // Restored: back to the plain sheet, and the loop rests.
        rest();
        raf = 0;
        return;
      }
      // Catches at once, then slows as it runs out of paper.
      const eased = 1 - (1 - s) ** 1.6;
      const front = FROM + (TO - FROM) * eased;
      render(now, front);
      if (hot && s < 1) {
        sparkDue += dt * SPARKS;
        for (; sparkDue >= 1; sparkDue -= 1) sparkFromEdge(front);
      }
      raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf && ready) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    // Where the pointer crossed into the sheet, as fractions of it — nudged
    // just inside, since it comes in over the stone frame.
    const entryPoint = (e: PointerEvent): [number, number] | null => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      const f = (v: number) => Math.min(0.98, Math.max(0.02, v));
      return [f((e.clientX - r.left) / r.width), f((e.clientY - r.top) / r.height)];
    };

    const enter = (e: Event) => {
      hot = true;
      // A fresh fire starts where the pointer came in. One still burning, or
      // still restoring, carries on from where it was lit.
      if (s === 0) {
        origin = e instanceof PointerEvent ? entryPoint(e) : null;
        if (ready) light(origin);
        // A puff of sparks where it catches.
        if (ready && e instanceof PointerEvent) {
          throwSparks({ x: e.clientX, y: e.clientY, n: 6, power: 0.55, scraps: 0.25 });
        }
      }
      if (ready) kick();
      else void build(true);
    };
    const leave = () => {
      hot = false;
      kick();
    };

    // Build the sheet as the card nears the viewport, before anyone hovers.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void build();
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(host);

    // A new size, or a new poster (a fallback, or a sharper srcset pick),
    // means a new sheet.
    let rebuildTimer = 0;
    const rebuild = () => {
      if (!ready) return;
      window.clearTimeout(rebuildTimer);
      rebuildTimer = window.setTimeout(() => {
        ready = false;
        void build();
      }, 200);
    };
    const ro = new ResizeObserver(rebuild);
    ro.observe(paperEl);
    const poster = paperEl.querySelector("img");
    poster?.addEventListener("load", rebuild);

    host.addEventListener("pointerenter", enter);
    host.addEventListener("pointerleave", leave);
    host.addEventListener("focus", enter);
    host.addEventListener("blur", leave);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(rebuildTimer);
      io.disconnect();
      ro.disconnect();
      poster?.removeEventListener("load", rebuild);
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("focus", enter);
      host.removeEventListener("blur", leave);
      host.removeAttribute("data-paper-ready");
      if (shared && texGen === shared.gen) {
        shared.gl.deleteTexture(paperTex);
        shared.gl.deleteTexture(mapTex);
      }
    };
  }, []);

  return <canvas ref={ref} className={className} style={style} aria-hidden="true" />;
}
