"use client";

import { useEffect, useRef } from "react";
import { PAPER_COLOR, PAPER_GRAIN } from "@/components/home/paper";

/**
 * Burns a paper card from the middle outward on hover, the way paper really
 * burns: it browns ahead of the fire, chars black, burns along a thin, broken,
 * flickering ember edge, and then is simply gone — showing whatever sits
 * beneath it in the card.
 *
 * How it works:
 * 1. Compose. The paper is painted once into an offscreen 2D canvas from the
 *    real DOM paper (`[data-paper]` in the parent): the grain, the printed
 *    poster (`img`) and every `[data-print]` element's text, drawn with its own
 *    computed font, colour, border and transform. The DOM paper is then hidden
 *    and this canvas takes its place, so the swap is invisible.
 * 2. Burn map. When each point of the sheet catches is precomputed once on the
 *    CPU (distance from an ignition point near the middle, domain-warped by
 *    fractal noise so the fire runs unevenly) into a small texture.
 * 3. Burn. Per frame, a tiny fragment shader compares that map with the
 *    advancing front — two texture reads and a little arithmetic per pixel.
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
  float e = b - front + (fine - 0.5) * 0.028;
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

const IDLE = -0.2;
const FROM = -0.01;
const TO = 1.03; // burns out to a few charred fibres at the very edges
const IN = 1.4; // seconds to burn through
const OUT = 0.55; // seconds to restore

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

/** When each point catches, 0 (first) → 1 (last), as 8-bit luminance. */
function burnMap(w: number, h: number) {
  const mw = 128;
  const mh = Math.max(16, Math.round((mw * h) / w));
  const aspect = w / h;
  const seed = Math.random() * 100;
  const fbm = makeNoise(seed);
  const cx = (0.5 + (Math.random() - 0.5) * 0.12) * aspect;
  const cy = 0.46 + (Math.random() - 0.5) * 0.12;
  const raw = new Float32Array(mw * mh);
  let lo = Infinity;
  let hi = -Infinity;
  for (let j = 0; j < mh; j++) {
    for (let i = 0; i < mw; i++) {
      const x = (i / (mw - 1)) * aspect;
      const y = j / (mh - 1);
      // Domain warp: the fire runs faster along some fibres than others.
      const wx = x + 0.32 * (fbm(x * 2.2, y * 2.2) - 0.5);
      const wy = y + 0.32 * (fbm(x * 2.2 + 9.1, y * 2.2 + 3.7) - 0.5);
      const d = Math.hypot(wx - cx, wy - cy);
      const v = d + 0.22 * fbm(x * 4.5 + 3.3, y * 4.5 + 7.1);
      raw[j * mw + i] = v;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  const out = new Uint8Array(mw * mh);
  for (let k = 0; k < raw.length; k++) out[k] = Math.round(((raw[k]! - lo) / (hi - lo)) * 255);
  return { data: out, mw, mh };
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
    const r = el.getBoundingClientRect();
    const cxp = (r.left + r.width / 2 - box.left) * sx;
    const cyp = (r.top + r.height / 2 - box.top) * sx;
    const ew = el.offsetWidth;
    const eh = el.offsetHeight;
    ctx.save();
    ctx.translate(cxp, cyp);
    if (cs.transform && cs.transform !== "none") {
      const m = new DOMMatrix(cs.transform);
      ctx.transform(m.a, m.b, m.c, m.d, 0, 0);
    }
    ctx.translate(-ew / 2, -eh / 2);
    const bw = parseFloat(cs.borderTopWidth) || 0;
    if (bw) {
      ctx.strokeStyle = cs.borderTopColor;
      ctx.lineWidth = bw;
      ctx.strokeRect(bw / 2, bw / 2, ew - bw, eh - bw);
    }
    const text = cs.textTransform === "uppercase" ? el.textContent!.toUpperCase() : el.textContent!;
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
    ctx.fillStyle = cs.color;
    ctx.globalAlpha = parseFloat(cs.opacity) || 1;
    ctx.textBaseline = "alphabetic";
    const m = ctx.measureText(text);
    const asc = m.fontBoundingBoxAscent;
    const desc = m.fontBoundingBoxDescent;
    const padL = parseFloat(cs.paddingLeft) + bw;
    const padT = parseFloat(cs.paddingTop) + bw;
    const padB = parseFloat(cs.paddingBottom) + bw;
    const inner = eh - padT - padB;
    ctx.fillText(text, padL, padT + (inner - (asc + desc)) / 2 + asc);
    ctx.restore();
  }
  return c;
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
    if (!canvas || !host || !paperEl) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    let gl: WebGLRenderingContext | null = null;
    let u: Record<string, WebGLUniformLocation | null> = {};
    let paperTex: WebGLTexture | null = null;
    let mapTex: WebGLTexture | null = null;
    let raf = 0;
    let s = 0;
    let hot = false;
    let last = 0;
    let ready = false;
    let building = false;
    let disposed = false;

    const setup = () => {
      gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
      if (!gl) return false;
      const sh = (type: number, src: string) => {
        const x = gl!.createShader(type)!;
        gl!.shaderSource(x, src);
        gl!.compileShader(x);
        return x;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      u = Object.fromEntries(
        ["paper", "map", "front", "t", "res"].map((n) => [n, gl!.getUniformLocation(prog, n)]),
      );
      gl.uniform1i(u.paper!, 0);
      gl.uniform1i(u.map!, 1);
      paperTex = gl.createTexture();
      mapTex = gl.createTexture();
      for (const tex of [paperTex, mapTex]) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      return true;
    };

    const draw = (now: number, front: number) => {
      if (!gl) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(u.front!, front);
      gl.uniform1f(u.t!, now / 1000);
      gl.uniform2f(u.res!, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const build = async () => {
      if (building || disposed) return;
      building = true;
      await document.fonts.ready;
      const img = paperEl.querySelector("img");
      if (img && !img.complete) await new Promise((r) => img.addEventListener("load", r, { once: true }));
      if (disposed) return;
      if (!gl && !setup()) {
        building = false;
        return;
      }
      const scale = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = paperEl.offsetWidth;
      const h = paperEl.offsetHeight;
      if (!w || !h) {
        building = false;
        return;
      }
      const sheet = await compose(paperEl, scale);
      const { data, mw, mh } = burnMap(w, h);
      if (disposed || !gl) return;
      const g = gl as WebGLRenderingContext;
      canvas.width = sheet.width;
      canvas.height = sheet.height;
      g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      g.activeTexture(g.TEXTURE0);
      g.bindTexture(g.TEXTURE_2D, paperTex);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, sheet);
      g.pixelStorei(g.UNPACK_ALIGNMENT, 1);
      g.activeTexture(g.TEXTURE1);
      g.bindTexture(g.TEXTURE_2D, mapTex);
      g.texImage2D(g.TEXTURE_2D, 0, g.LUMINANCE, mw, mh, 0, g.LUMINANCE, g.UNSIGNED_BYTE, data);
      draw(performance.now(), IDLE);
      ready = true;
      building = false;
      host.setAttribute("data-paper-ready", "");
      if (hot) kick();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s = hot ? Math.min(1, s + dt / IN) : Math.max(0, s - dt / OUT);
      // Catches at once, then slows as it runs out of paper.
      const eased = 1 - (1 - s) ** 1.6;
      draw(now, s === 0 ? IDLE : FROM + (TO - FROM) * eased);
      raf = hot || s > 0 ? requestAnimationFrame(frame) : 0;
    };
    const kick = () => {
      if (!raf && ready) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const enter = () => {
      hot = true;
      if (ready) kick();
      else void build();
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

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      if (!ready) return;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        ready = false;
        void build();
      }, 200);
    });
    ro.observe(paperEl);

    host.addEventListener("pointerenter", enter);
    host.addEventListener("pointerleave", leave);
    host.addEventListener("focus", enter);
    host.addEventListener("blur", leave);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      io.disconnect();
      ro.disconnect();
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("focus", enter);
      host.removeEventListener("blur", leave);
      host.removeAttribute("data-paper-ready");
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={ref} className={className} style={style} aria-hidden="true" />;
}
