import { useRef, useEffect, useMemo } from 'react';

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 v_uv;
  uniform float uTime;
  uniform float uGridSize;
  uniform vec2 uMouse;
  uniform vec2 uMouseTrail;
  uniform float uTimeScale;
  uniform float uBaseGray;
  uniform float uFlickerBase;
  uniform float uFlickerSinAmp;
  uniform float uFlickerSinFreq;
  uniform float uFlickerHashMix;
  uniform float uCursorRadius;
  uniform float uCursorShift;
  uniform float uTrailRadius;
  uniform float uTrailShift;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 cell = floor(v_uv * uGridSize);
    vec2 cellId = cell / uGridSize;

    float t = uTime * uTimeScale + hash(cellId);
    float flicker = uFlickerBase + uFlickerSinAmp * sin(t * uFlickerSinFreq)
      + uFlickerHashMix * hash(cellId + 0.1);
    float g = uBaseGray + flicker * hash(cellId + floor(t));

    if (uMouse.x >= 0.0) {
      float distCursor = length(v_uv - uMouse);
      float falloff = 1.0 - smoothstep(0.0, uCursorRadius, distCursor);
      float mouseShift = uCursorShift * falloff * (hash(cellId + uMouse * 10.0) * 2.0 - 0.5);
      g += mouseShift;
      if (uMouseTrail.x >= 0.0) {
        float distTrail = length(v_uv - uMouseTrail);
        float trailFalloff = 1.0 - smoothstep(0.0, uTrailRadius, distTrail);
        float trailShift = uTrailShift * trailFalloff * (hash(cellId + uMouseTrail * 10.0) * 2.0 - 0.5);
        g += trailShift;
      }
    }

    g = clamp(g, 0.0, 1.0);
    gl_FragColor = vec4(g, g, g, 1.0);
  }
`;

/** Shipped defaults for the TV static shader. */
export const DEFAULT_TV_SHADER_PARAMS = {
  gridSize: 24,
  timeScale: 2.65,
  baseGray: 0.85,
  flickerBase: 0.205,
  flickerSinAmp: 0.12,
  flickerSinFreq: 3.2,
  flickerHashMix: 0.08,
  cursorRadius: 0.25,
  cursorShift: 0.17,
  trailRadius: 0.74,
  trailShift: 0.045,
  mouseLerp: 0.125,
} as const;

export type TVShaderParams = {
  gridSize: number;
  timeScale: number;
  baseGray: number;
  flickerBase: number;
  flickerSinAmp: number;
  flickerSinFreq: number;
  flickerHashMix: number;
  cursorRadius: number;
  cursorShift: number;
  trailRadius: number;
  trailShift: number;
  mouseLerp: number;
};

export interface TVStaticCanvasProps {
  width: number;
  height: number;
  /** When set, overrides `gridSize` from defaults. */
  gridSize?: number;
  className?: string;
}

export function TVStaticCanvas({
  width,
  height,
  gridSize: gridSizeProp,
  className = '',
}: TVStaticCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseTargetRef = useRef({ x: -1, y: -1 });

  const effectiveParams: TVShaderParams = useMemo(
    () => ({
      ...DEFAULT_TV_SHADER_PARAMS,
      ...(gridSizeProp != null ? { gridSize: gridSizeProp } : {}),
    }),
    [gridSizeProp]
  );

  const paramsRef = useRef(effectiveParams);
  paramsRef.current = effectiveParams;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: false });
    if (!gl) return;

    const compile = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compile(VERTEX_SHADER, gl.VERTEX_SHADER);
    const fs = compile(FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'uTime');
    const uGridSize = gl.getUniformLocation(program, 'uGridSize');
    const uMouse = gl.getUniformLocation(program, 'uMouse');
    const uMouseTrail = gl.getUniformLocation(program, 'uMouseTrail');
    const uTimeScale = gl.getUniformLocation(program, 'uTimeScale');
    const uBaseGray = gl.getUniformLocation(program, 'uBaseGray');
    const uFlickerBase = gl.getUniformLocation(program, 'uFlickerBase');
    const uFlickerSinAmp = gl.getUniformLocation(program, 'uFlickerSinAmp');
    const uFlickerSinFreq = gl.getUniformLocation(program, 'uFlickerSinFreq');
    const uFlickerHashMix = gl.getUniformLocation(program, 'uFlickerHashMix');
    const uCursorRadius = gl.getUniformLocation(program, 'uCursorRadius');
    const uCursorShift = gl.getUniformLocation(program, 'uCursorShift');
    const uTrailRadius = gl.getUniformLocation(program, 'uTrailRadius');
    const uTrailShift = gl.getUniformLocation(program, 'uTrailShift');

    let raf = 0;
    const start = performance.now();
    let smoothedX = -1;
    let smoothedY = -1;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const p = paramsRef.current;
      const target = mouseTargetRef.current;
      const lerp = p.mouseLerp;
      smoothedX += (target.x - smoothedX) * lerp;
      smoothedY += (target.y - smoothedY) * lerp;

      const t = (performance.now() - start) / 1000;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uGridSize, p.gridSize);
      gl.uniform2f(uMouse, target.x, target.y);
      gl.uniform2f(uMouseTrail, smoothedX, smoothedY);
      gl.uniform1f(uTimeScale, p.timeScale);
      gl.uniform1f(uBaseGray, p.baseGray);
      gl.uniform1f(uFlickerBase, p.flickerBase);
      gl.uniform1f(uFlickerSinAmp, p.flickerSinAmp);
      gl.uniform1f(uFlickerSinFreq, p.flickerSinFreq);
      gl.uniform1f(uFlickerHashMix, p.flickerHashMix);
      gl.uniform1f(uCursorRadius, p.cursorRadius);
      gl.uniform1f(uCursorShift, p.cursorShift);
      gl.uniform1f(uTrailRadius, p.trailRadius);
      gl.uniform1f(uTrailShift, p.trailShift);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    draw();

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      mouseTargetRef.current = { x, y };
    };
    const onMouseLeave = () => {
      mouseTargetRef.current = { x: -1, y: -1 };
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(raf);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
      aria-hidden
    />
  );
}
