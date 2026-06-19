"use client";

import { useEffect, useRef } from "react";

/**
 * Hero background with a WebGL water-ripple effect on mouse hover.
 *
 * Renders the sunset still on a WebGL2 canvas and runs a heightmap wave
 * simulation (classic ping-pong wave equation); pointer movement over the hero
 * drops ripples that refract the image. Degrades gracefully: if WebGL2 (with a
 * half-float render target) isn't available, the plain <img> background stays
 * and nothing animates. The whole layer carries the hero's opacity + bottom
 * fade so it matches the rest of the design.
 */
const IMG = "/brand/hero-bg.jpg";
const SIM = 256; // simulation grid resolution (square)

const VERT = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;

// Wave propagation: r = current height, g = previous height.
const SIM_FS = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 o;
uniform sampler2D u_prev;
uniform vec2 u_texel;
uniform float u_damping;
void main() {
  float c = texture(u_prev, v_uv).r;
  float p = texture(u_prev, v_uv).g;
  float l = texture(u_prev, v_uv - vec2(u_texel.x, 0.0)).r;
  float r = texture(u_prev, v_uv + vec2(u_texel.x, 0.0)).r;
  float u = texture(u_prev, v_uv - vec2(0.0, u_texel.y)).r;
  float d = texture(u_prev, v_uv + vec2(0.0, u_texel.y)).r;
  float n = (l + r + u + d) * 0.5 - p;
  n *= u_damping;
  o = vec4(n, c, 0.0, 1.0);
}`;

// Additive gaussian "drop" at the pointer.
const DROP_FS = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 o;
uniform vec2 u_mouse;
uniform float u_strength;
uniform float u_radius;
uniform float u_aspect;
void main() {
  vec2 a = vec2(u_aspect, 1.0);
  float dist = distance(v_uv * a, u_mouse * a);
  float amt = u_strength * exp(-(dist * dist) / (u_radius * u_radius));
  o = vec4(amt, 0.0, 0.0, 0.0);
}`;

// Refract the image by the height-field gradient; add a faint slope highlight.
const RENDER_FS = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 o;
uniform sampler2D u_sim;
uniform sampler2D u_image;
uniform vec2 u_texel;
uniform float u_canvasAspect;
uniform float u_imageAspect;
uniform float u_refract;
void main() {
  float hx = texture(u_sim, v_uv + vec2(u_texel.x, 0.0)).r - texture(u_sim, v_uv - vec2(u_texel.x, 0.0)).r;
  float hy = texture(u_sim, v_uv + vec2(0.0, u_texel.y)).r - texture(u_sim, v_uv - vec2(0.0, u_texel.y)).r;
  vec2 offset = vec2(hx, hy) * u_refract;
  float ca = u_canvasAspect, ia = u_imageAspect;
  vec2 scale = ca > ia ? vec2(1.0, ia / ca) : vec2(ca / ia, 1.0);
  vec2 uv = (v_uv - 0.5) * scale + 0.5 + offset;
  vec3 col = texture(u_image, uv).rgb;
  col += clamp((hx + hy) * 5.0, -0.12, 0.12);
  o = vec4(col, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) || "shader compile failed");
  }
  return s;
}

function program(gl: WebGL2RenderingContext, fs: string) {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, "a_pos");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || "program link failed");
  }
  return p;
}

export default function HeroWater({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.closest("section");
    if (!canvas || !section) return;

    const ctx = canvas.getContext("webgl2", { premultipliedAlpha: false, antialias: false });
    if (!ctx || !ctx.getExtension("EXT_color_buffer_float")) return; // no float RT → keep <img> fallback
    const gl: WebGL2RenderingContext = ctx; // non-null for the closures below

    let disposed = false;
    let raf = 0;
    let running = true;
    let lastActive = performance.now();

    // Fullscreen triangle-pair quad.
    const quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const simProg = program(gl, SIM_FS);
    const dropProg = program(gl, DROP_FS);
    const renderProg = program(gl, RENDER_FS);

    // Ping-pong half-float render targets for the height field.
    function makeTarget() {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SIM, SIM, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return { tex, fbo };
    }
    let a = makeTarget();
    let b = makeTarget();

    const imgTex = gl.createTexture()!;
    let imageAspect = 1.5;
    let ready = false;

    // Pointer state.
    let mx = 0.5,
      my = 0.5,
      strength = 0,
      moved = false;
    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = 1 - (e.clientY - r.top) / r.height; // GL y is up
      const d = Math.hypot(nx - mx, ny - my);
      mx = nx;
      my = ny;
      strength = Math.min(0.16, strength + d * 1.2 + 0.012);
      moved = true;
      lastActive = performance.now();
      if (!running && !disposed) {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    };
    const onLeave = () => {
      moved = false;
    };
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(section!.clientWidth * dpr));
      const h = Math.max(1, Math.round(section!.clientHeight * dpr));
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
    }
    const ro = new ResizeObserver(resize);
    ro.observe(section);
    resize();

    const draw = () => {
      if (disposed) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.viewport(0, 0, SIM, SIM);
      gl.disable(gl.BLEND);

      // 1) Propagate waves: a -> b.
      gl.useProgram(simProg);
      gl.bindFramebuffer(gl.FRAMEBUFFER, b.fbo);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, a.tex);
      gl.uniform1i(gl.getUniformLocation(simProg, "u_prev"), 0);
      gl.uniform2f(gl.getUniformLocation(simProg, "u_texel"), 1 / SIM, 1 / SIM);
      gl.uniform1f(gl.getUniformLocation(simProg, "u_damping"), 0.992);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // 2) Drop new energy at the pointer (additive) into b.
      if (strength > 0.0005) {
        gl.useProgram(dropProg);
        gl.bindFramebuffer(gl.FRAMEBUFFER, b.fbo);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.uniform2f(gl.getUniformLocation(dropProg, "u_mouse"), mx, my);
        gl.uniform1f(gl.getUniformLocation(dropProg, "u_strength"), strength * 0.16);
        gl.uniform1f(gl.getUniformLocation(dropProg, "u_radius"), 0.05);
        gl.uniform1f(
          gl.getUniformLocation(dropProg, "u_aspect"),
          Math.max(1, section!.clientWidth) / Math.max(1, section!.clientHeight),
        );
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disable(gl.BLEND);
      }
      strength *= moved ? 0.9 : 0.82;

      [a, b] = [b, a]; // newest height is now in `a`

      // 3) Render the refracted image to the screen.
      if (ready) {
        gl.useProgram(renderProg);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas!.width, canvas!.height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, a.tex);
        gl.uniform1i(gl.getUniformLocation(renderProg, "u_sim"), 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, imgTex);
        gl.uniform1i(gl.getUniformLocation(renderProg, "u_image"), 1);
        gl.uniform2f(gl.getUniformLocation(renderProg, "u_texel"), 1 / SIM, 1 / SIM);
        gl.uniform1f(
          gl.getUniformLocation(renderProg, "u_canvasAspect"),
          canvas!.width / canvas!.height,
        );
        gl.uniform1f(gl.getUniformLocation(renderProg, "u_imageAspect"), imageAspect);
        gl.uniform1f(gl.getUniformLocation(renderProg, "u_refract"), 0.18);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      // Freeze on a settled (undistorted) frame when the pointer's been idle;
      // pointermove restarts the loop. Saves GPU/battery when nothing's moving.
      if (ready && !moved && strength < 0.001 && performance.now() - lastActive > 2500) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(draw);
    };

    const img = new Image();
    img.src = IMG;
    img.onload = () => {
      if (disposed) return;
      imageAspect = img.naturalWidth / img.naturalHeight;
      gl.bindTexture(gl.TEXTURE_2D, imgTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      ready = true;
      // Hand off from the <img> fallback to the canvas once it can draw.
      if (fallbackRef.current) fallbackRef.current.style.opacity = "0";
      raf = requestAnimationFrame(draw);
    };

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      const lose = gl.getExtension("WEBGL_lose_context");
      lose?.loseContext();
    };
  }, []);

  return (
    <div aria-hidden className={className}>
      <div
        ref={fallbackRef}
        className="absolute inset-0 bg-[url('/brand/hero-bg.jpg')] bg-cover bg-center transition-opacity duration-700"
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
