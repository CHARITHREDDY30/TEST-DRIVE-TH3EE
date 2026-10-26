import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RotateCw, ZoomIn, ZoomOut, Eye, Sparkles, RefreshCcw } from 'lucide-react';

export interface TShirt3DCanvasProps {
  colorHex?: string;
  silhouette?: 'oversized' | 'boxy' | 'regular' | 'heavyweight';
  artworkUrl?: string | null;
  placementType?: 'front' | 'back' | 'both' | 'chest';
  artworkScale?: number;
  artworkRotation?: number;
  artworkOffsetX?: number;
  artworkOffsetY?: number;
  artworkOpacity?: number;
  blendMode?: 'screen-print' | 'dtg' | 'vintage';
  view?: 'front' | 'back';
  onViewChange?: (view: 'front' | 'back') => void;
  className?: string;
}

const SHIRT_SCALE = 0.3;

export const TShirt3DCanvas: React.FC<TShirt3DCanvasProps> = ({
  colorHex = '#121316',
  silhouette = 'oversized',
  artworkUrl = null,
  placementType = 'front',
  artworkScale = 1.0,
  artworkRotation = 0,
  artworkOffsetX = 0,
  artworkOffsetY = 0,
  artworkOpacity = 1.0,
  blendMode = 'screen-print',
  view = 'front',
  onViewChange,
  className = 'w-full h-full min-h-[340px]'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Engine state refs to prevent re-instantiation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const tShirtGroupRef = useRef<THREE.Group | null>(null);
  const fabricMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const fabricNormalTexRef = useRef<THREE.CanvasTexture | null>(null);

  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frontCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const backCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const frontTexRef = useRef<THREE.CanvasTexture | null>(null);
  const backTexRef = useRef<THREE.CanvasTexture | null>(null);

  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  // Interaction controls
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const zoomLevelRef = useRef(2.3);

  /**
   * 1. Procedural Fabric Normal Map Generator
   * Synthesizes micro-woven cotton yarn normals without external image assets.
   */
  const createProceduralFabricNormal = useCallback((): THREE.CanvasTexture => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        // Synthesize orthogonal warp and weft yarn weave
        const warp = Math.sin((x / size) * Math.PI * 32);
        const weft = Math.cos((y / size) * Math.PI * 32);
        const nx = (warp * 0.45) * 127 + 128;
        const ny = (weft * 0.45) * 127 + 128;
        const nz = 255;

        data[idx] = Math.min(255, Math.max(0, nx));
        data[idx + 1] = Math.min(255, Math.max(0, ny));
        data[idx + 2] = nz;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.4, 2.4);
    return tex;
  }, []);

  /**
   * 2. Rasterizes Artwork onto Front and Back Decal Canvases
   */
  const renderCanvasTexture = useCallback(() => {
    if (fabricMaterialRef.current) {
      fabricMaterialRef.current.color.set(colorHex);
    }
    if (tShirtGroupRef.current) {
      const collar = tShirtGroupRef.current.getObjectByName('collarMesh') as THREE.Mesh;
      if (collar && collar.material) {
        (collar.material as THREE.MeshStandardMaterial).color.set(colorHex).multiplyScalar(0.92);
      }
    }

    const frontCtx = frontCtxRef.current;
    const backCtx = backCtxRef.current;
    if (!frontCtx || !backCtx) return;

    frontCtx.clearRect(0, 0, 1024, 1280);
    backCtx.clearRect(0, 0, 1024, 1280);

    const img = loadedImageRef.current;

    // Determine front & back zones based on placementType
    const frontZones: Array<{ x: number; y: number; m: number; wide?: boolean }> = [];
    const backZones: Array<{ x: number; y: number; m: number; wide?: boolean }> = [];

    if (placementType === 'front') {
      frontZones.push({ x: 512, y: 660, m: 860 });
    } else if (placementType === 'back') {
      backZones.push({ x: 512, y: 660, m: 860 });
    } else if (placementType === 'chest') {
      frontZones.push({ x: 720, y: 340, m: 260 }); // Left chest (wearer's left = viewer's right)
    } else if (placementType === 'both') {
      frontZones.push({ x: 720, y: 340, m: 260 });
      backZones.push({ x: 512, y: 660, m: 860 });
    } else {
      frontZones.push({ x: 512, y: 660, m: 860 });
    }

    const drawArt = (ctx: CanvasRenderingContext2D, z: { x: number; y: number; m: number; wide?: boolean }) => {
      if (!img || !img.width || !img.height) return;

      const aspect = img.width / img.height;
      let w: number, h: number;
      const maxW = z.m;
      const maxH = z.wide ? z.m * 0.36 : z.m * 1.2;

      if (maxW / aspect <= maxH) {
        w = maxW;
        h = maxW / aspect;
      } else {
        h = maxH;
        w = maxH * aspect;
      }

      w *= artworkScale;
      h *= artworkScale;

      ctx.save();
      ctx.translate(z.x + artworkOffsetX * 4, z.y + artworkOffsetY * 4);
      ctx.rotate((artworkRotation * Math.PI) / 180);

      if (blendMode === 'screen-print') {
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = artworkOpacity;
      } else if (blendMode === 'vintage') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = artworkOpacity * 0.78;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = artworkOpacity;
      }

      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    };

    if (img) {
      frontZones.forEach(z => drawArt(frontCtx, z));
      backZones.forEach(z => drawArt(backCtx, z));
    }

    if (frontTexRef.current) frontTexRef.current.needsUpdate = true;
    if (backTexRef.current) backTexRef.current.needsUpdate = true;
  }, [
    colorHex,
    placementType,
    artworkScale,
    artworkRotation,
    artworkOffsetX,
    artworkOffsetY,
    artworkOpacity,
    blendMode
  ]);

  /**
   * 3. Apply Silhouette Morphing
   */
  const applySilhouetteMorph = useCallback((fitType: string) => {
    if (!tShirtGroupRef.current) return;
    const k = SHIRT_SCALE;
    const fits: Record<string, [number, number, number]> = {
      oversized:   [1.12, 1.02, 1.18],
      boxy:        [1.20, 0.92, 1.15],
      regular:     [0.96, 1.00, 1.00],
      heavyweight: [1.16, 1.06, 1.25]
    };
    const f = fits[fitType] || fits.oversized;
    tShirtGroupRef.current.scale.set(k * f[0], k * f[1], k * f[2]);
  }, []);

  /**
   * 4. Build 3D T-Shirt Model (Extrusion, Ribbed Collar Tube, Front & Back Decals)
   */
  const build3DTShirtModel = useCallback((scene: THREE.Scene, renderer: THREE.WebGLRenderer) => {
    if (tShirtGroupRef.current) {
      scene.remove(tShirtGroupRef.current);
    }

    const tShirtMeshGroup = new THREE.Group();

    // Streetwear Silhouette (Oversized Drop-Shoulder Outline)
    const s = new THREE.Shape();
    s.moveTo(-0.78, 2.52);
    s.lineTo(-1.95, 2.32);
    s.lineTo(-3.45, 0.95);
    s.lineTo(-2.85, 0.15);
    s.lineTo(-2.02, 0.72);
    s.lineTo(-2.02, -2.55);
    s.lineTo(2.02, -2.55);
    s.lineTo(2.02, 0.72);
    s.lineTo(2.85, 0.15);
    s.lineTo(3.45, 0.95);
    s.lineTo(1.95, 2.32);
    s.lineTo(0.78, 2.52);
    s.quadraticCurveTo(0, 1.52, -0.78, 2.52); // Crewneck cutout

    const D = 0.38;
    const B = 0.14;
    const bodyGeo = new THREE.ExtrudeGeometry(s, {
      depth: D,
      bevelEnabled: true,
      bevelSize: B,
      bevelThickness: B,
      bevelSegments: 8,
      curveSegments: 32
    });
    bodyGeo.translate(0, 0, -D / 2);

    fabricMaterialRef.current = new THREE.MeshStandardMaterial({
      color: colorHex,
      normalMap: fabricNormalTexRef.current,
      normalScale: new THREE.Vector2(0.48, 0.48),
      roughness: 0.94,
      metalness: 0.02
    });

    const body = new THREE.Mesh(bodyGeo, fabricMaterialRef.current);
    body.castShadow = true;
    body.receiveShadow = true;
    tShirtMeshGroup.add(body);

    // Ribbed Crewneck Collar (Curved 3D Tube)
    const pts: THREE.Vector3[] = [];
    const segments = 44;
    for (let i = 0; i < segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const sn = Math.sin(t);
      const x = 0.82 * Math.cos(t);
      const y = sn > 0 ? 2.52 - 1.0 * sn : 2.52 + 0.14 * -sn;
      const zz = (D / 2 + B) * 0.92 * (sn > 0 ? 1 : 0.92) * Math.sign(sn || 1) * Math.min(1, Math.abs(sn) * 3 + 0.2);
      pts.push(new THREE.Vector3(x, y, zz));
    }

    const collarGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, 0.11, 14, true);
    const collarMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex).multiplyScalar(0.92),
      roughness: 0.96,
      normalMap: fabricNormalTexRef.current,
      normalScale: new THREE.Vector2(0.9, 0.9)
    });

    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.name = 'collarMesh';
    collar.castShadow = true;
    tShirtMeshGroup.add(collar);

    // Dynamic 2D Print Canvases & Decal Texture Buffers
    const createBuffer = () => {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 1280;
      return c;
    };

    const frontCanvas = createBuffer();
    const backCanvas = createBuffer();
    frontCanvasRef.current = frontCanvas;
    backCanvasRef.current = backCanvas;
    frontCtxRef.current = frontCanvas.getContext('2d');
    backCtxRef.current = backCanvas.getContext('2d');

    const aniso = renderer.capabilities?.getMaxAnisotropy() || 1;
    const frontTex = new THREE.CanvasTexture(frontCanvas);
    const backTex = new THREE.CanvasTexture(backCanvas);
    frontTexRef.current = frontTex;
    backTexRef.current = backTex;

    [frontTex, backTex].forEach(t => {
      t.anisotropy = aniso;
      if ('colorSpace' in t && typeof THREE.SRGBColorSpace !== 'undefined') {
        t.colorSpace = THREE.SRGBColorSpace;
      }
    });

    // Decal Layers (Front & Back)
    const zf = D / 2 + B + 0.014;
    const mkPrint = (tex: THREE.CanvasTexture, front: boolean) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(3.3, 4.2),
        new THREE.MeshStandardMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
          roughness: 0.65,
          metalness: 0.0,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2
        })
      );
      m.position.set(0, -0.2, front ? zf : -zf);
      if (!front) m.rotation.y = Math.PI;
      m.name = front ? 'printFront' : 'printBack';
      return m;
    };

    tShirtMeshGroup.add(mkPrint(frontTex, true));
    tShirtMeshGroup.add(mkPrint(backTex, false));

    tShirtMeshGroup.position.y = 0.05;
    tShirtGroupRef.current = tShirtMeshGroup;

    applySilhouetteMorph(silhouette);
    renderCanvasTexture();

    scene.add(tShirtMeshGroup);
  }, [colorHex, silhouette, applySilhouetteMorph, renderCanvasTexture]);

  // Load Artwork Image
  useEffect(() => {
    if (!artworkUrl) {
      loadedImageRef.current = null;
      renderCanvasTexture();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = artworkUrl;
    img.onload = () => {
      loadedImageRef.current = img;
      renderCanvasTexture();
    };
    img.onerror = () => {
      console.warn('Failed to load artwork image into 3D viewer:', artworkUrl);
      loadedImageRef.current = null;
      renderCanvasTexture();
    };
  }, [artworkUrl, renderCanvasTexture]);

  // Color change update
  useEffect(() => {
    renderCanvasTexture();
  }, [colorHex, renderCanvasTexture]);

  // Silhouette change update
  useEffect(() => {
    applySilhouetteMorph(silhouette);
  }, [silhouette, applySilhouetteMorph]);

  // Handle front / back view change from prop
  useEffect(() => {
    if (view === 'front') {
      targetRotationRef.current.y = 0;
    } else if (view === 'back') {
      targetRotationRef.current.y = Math.PI;
    }
  }, [view]);

  // Initialize Three.js Scene, Camera, Lighting & Renderer
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 420;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0, zoomLevelRef.current);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing & shadow map
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if ('colorSpace' in renderer && typeof THREE.SRGBColorSpace !== 'undefined') {
      renderer.colorSpace = THREE.SRGBColorSpace;
    }
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting Rig tailored for Luxury Heavyweight Streetwear
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(2.5, 4, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe8eef5, 1.1);
    fillLight.position.set(-3, 1.5, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.3);
    rimLight.position.set(0, 3, -3.5);
    scene.add(rimLight);

    // Bottom soft reflector
    const bounceLight = new THREE.DirectionalLight(0xffffff, 0.4);
    bounceLight.position.set(0, -3, 2);
    scene.add(bounceLight);

    // 5. Procedural Normal Texture
    fabricNormalTexRef.current = createProceduralFabricNormal();

    // 6. Build 3D Model
    build3DTShirtModel(scene, renderer);

    // 7. Interaction Event Listeners (Pointer Drag for 360 rotation)
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevPointerRef.current = { x: clientX, y: clientY };
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - prevPointerRef.current.x;
      const deltaY = clientY - prevPointerRef.current.y;
      prevPointerRef.current = { x: clientX, y: clientY };

      targetRotationRef.current.y += deltaX * 0.012;
      targetRotationRef.current.x = Math.max(-0.45, Math.min(0.45, targetRotationRef.current.x + deltaY * 0.008));
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    domElement.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // 8. Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (isAutoRotating && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.008;
      }

      // Smooth interpolation (damping)
      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.1;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.1;

      if (tShirtGroupRef.current) {
        tShirtGroupRef.current.rotation.x = currentRotationRef.current.x;
        tShirtGroupRef.current.rotation.y = currentRotationRef.current.y;
      }

      if (cameraRef.current) {
        cameraRef.current.position.z += (zoomLevelRef.current - cameraRef.current.position.z) * 0.1;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });

    resizeObserver.observe(container);

    // Cleanup
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();

      domElement.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);

      domElement.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      renderer.dispose();
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, [createProceduralFabricNormal, build3DTShirtModel, isAutoRotating]);

  // Controls Handlers
  const handleSnapFront = () => {
    targetRotationRef.current = { x: 0, y: 0 };
    onViewChange?.('front');
  };

  const handleSnapBack = () => {
    targetRotationRef.current = { x: 0, y: Math.PI };
    onViewChange?.('back');
  };

  const handleZoomIn = () => {
    zoomLevelRef.current = Math.max(1.6, zoomLevelRef.current - 0.25);
  };

  const handleZoomOut = () => {
    zoomLevelRef.current = Math.min(3.4, zoomLevelRef.current + 0.25);
  };

  const handleReset = () => {
    targetRotationRef.current = { x: 0, y: 0 };
    zoomLevelRef.current = 2.3;
    onViewChange?.('front');
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full min-h-[340px] sm:min-h-[420px] cursor-grab active:cursor-grabbing flex items-center justify-center touch-none"
        title="Click and drag to rotate in 360°"
      />

      {/* Floating 3D Interaction Control Overlay */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
        <span className="bg-neutral-900/80 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-xs flex items-center gap-1 shadow-xs border border-white/10">
          <Sparkles className="w-3 h-3 text-[#E51E2B]" />
          <span>3D Studio • 360° Drag</span>
        </span>
      </div>

      {/* Quick View Controls */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-1 pointer-events-auto bg-white/90 backdrop-blur-xs p-1 rounded-xs border border-neutral-200 shadow-xs">
          <button
            type="button"
            onClick={handleSnapFront}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-2xs transition-colors ${
              Math.abs(targetRotationRef.current.y % (Math.PI * 2)) < 0.5
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-700 hover:text-black'
            }`}
          >
            Front
          </button>
          <button
            type="button"
            onClick={handleSnapBack}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-2xs transition-colors ${
              Math.abs(targetRotationRef.current.y % (Math.PI * 2) - Math.PI) < 0.5
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-700 hover:text-black'
            }`}
          >
            Back
          </button>
        </div>

        <div className="flex items-center gap-1 pointer-events-auto bg-white/90 backdrop-blur-xs p-1 rounded-xs border border-neutral-200 shadow-xs">
          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-1.5 rounded-2xs transition-colors ${
              isAutoRotating ? 'bg-[#E51E2B] text-white' : 'text-neutral-700 hover:text-black'
            }`}
            title={isAutoRotating ? 'Pause 360° Rotation' : 'Auto 360° Spin'}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 text-neutral-700 hover:text-black rounded-2xs transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 text-neutral-700 hover:text-black rounded-2xs transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-neutral-700 hover:text-black rounded-2xs transition-colors"
            title="Reset View"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TShirt3DCanvas;
