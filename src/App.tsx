import { useEffect, useRef, useState } from 'react';
import './game.css';

type Road = 'Village' | 'City' | 'Highway';
type CarKind =
  | 'Thar-style 4x4'
  | 'Fortuner-style SUV'
  | 'BMW-style Coupe'
  | 'Mercedes-style Sedan';
const colors = [
  '#e52b36',
  '#00c8ff',
  '#f4f4f4',
  '#ffbd2e',
  '#a855f7',
  '#15191f',
];

export default function App() {
  const mount = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);
  const [carKind, setCarKind] = useState<CarKind>('Thar-style 4x4');
  const [paint, setPaint] = useState(colors[0]);
  const [road, setRoad] = useState<Road>('Village');
  const [led, setLed] = useState(true);
  const [headlights, setHeadlights] = useState(true);
  const [hazard, setHazard] = useState(false);
  const [doors, setDoors] = useState(false);
  const [windows, setWindows] = useState(false);
  const [music, setMusic] = useState(false);
  const [nitro, setNitro] = useState(false);
  const [cameraMode, setCameraMode] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [toast, setToast] = useState('Welcome to Indian roads');
  const held = useRef({ left: false, right: false, gas: false, brake: false });
  const audio = useRef<{
    ctx?: AudioContext;
    osc?: OscillatorNode;
    gain?: GainNode;
  }>({});
  const hideTimer = useRef<number | undefined>(undefined);

  const say = (message: string) => {
    setToast(message);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setToast(''), 1800);
  };
  useEffect(() => {
    let active = true,
      renderer: any,
      frame = 0,
      scene: any,
      camera: any,
      car: any,
      body: any,
      ledMeshes: any[] = [];
    let THREE: any;
    const start = async () => {
      try {
        THREE = await import(
          /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'
        );
        const { RoundedBoxGeometry } = await import(
          /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/geometries/RoundedBoxGeometry.js'
        );
        if (!active || !mount.current) return;
        scene = new THREE.Scene();
        scene.background = new THREE.Color(
          road === 'City' ? 0x9bc8e8 : 0x8dc5ec
        );
        scene.fog = new THREE.Fog(scene.background, 65, 260);
        camera = new THREE.PerspectiveCamera(
          62,
          innerWidth / innerHeight,
          0.1,
          600
        );
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
        renderer.setSize(mount.current.clientWidth, mount.current.clientHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mount.current.replaceChildren(renderer.domElement);
        scene.add(new THREE.HemisphereLight(0xd7e3ec, 0x45483f, 1.45));
        const sun = new THREE.DirectionalLight(0xfff3df, 3.1);
        sun.position.set(-18, 35, 16);
        sun.castShadow = true;
        scene.add(sun);
        const mat = (c: number | string, r = 0.5, m = 0) =>
          new THREE.MeshStandardMaterial({
            color: c,
            roughness: r,
            metalness: m,
          });
        const box = (
          parent: any,
          w: number,
          h: number,
          d: number,
          material: any,
          x: number,
          y: number,
          z: number
        ) => {
          const geometry = parent === car
            ? new RoundedBoxGeometry(w, h, d, 3, Math.min(0.12, Math.min(w, h, d) * 0.22))
            : new THREE.BoxGeometry(w, h, d);
          const o = new THREE.Mesh(geometry, material);
          o.position.set(x, y, z);
          o.castShadow = true;
          o.receiveShadow = true;
          parent.add(o);
          return o;
        };
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(1000, 1000),
          mat(road === 'City' ? 0x626a6e : 0x596b50, 0.96)
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.13;
        ground.receiveShadow = true;
        scene.add(ground);
        const roadMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(road === 'Highway' ? 19 : 14, 800),
          mat(0x292d31, 0.98)
        );
        roadMesh.rotation.x = -Math.PI / 2;
        roadMesh.position.set(0, -0.09, -300);
        scene.add(roadMesh);
        const moving: any[] = [];
        // Road shoulders, lane reflectors and roadside barriers add depth to the driving scene.
        for (const side of [-1, 1]) {
          const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 800), mat(road === 'Highway' ? 0x8a8b82 : 0x7b8569));
          shoulder.rotation.x = -Math.PI / 2;
          shoulder.position.set(side * 8.1, -0.075, -300);
          scene.add(shoulder);
          if (road === 'Highway') {
            for (let z = 70; z > -650; z -= 16) {
              const barrier = box(scene, 0.18, 0.55, 5.5, mat(0xc2c5c6), side * 9.4, 0.18, z);
              barrier.userData.flow = true;
              moving.push(barrier);
            }
          }
        }
        for (let z = 80; z > -650; z -= 12) {
          const mark = new THREE.Mesh(
            new THREE.PlaneGeometry(0.17, 5),
            mat(0xf4efd9)
          );
          mark.rotation.x = -Math.PI / 2;
          mark.position.set(0, -0.05, z);
          mark.userData.flow = true;
          scene.add(mark);
          moving.push(mark);
        }
        for (const x of [-7, 7]) {
          const edge = box(
            scene,
            0.12,
            0.025,
            800,
            mat(0xf4efd9),
            x,
            -0.045,
            -300
          );
        }
        for (let i = 0; i < 70; i++) {
          for (const side of [-1, 1]) {
            const z = -Math.random() * 650,
              x = side * (10 + Math.random() * 11);
            if (road === 'City' && i % 2 === 0) {
              const height = 3 + Math.random() * 10;
              const building = box(
                scene,
                2 + Math.random() * 3,
                height,
                2 + Math.random() * 2,
                mat([0x929b9e, 0xa49f94, 0x777f84][i % 3], 0.88),
                x,
                height / 2,
                z
              );
              building.userData.flow = true;
              moving.push(building);
              for (let wy = 1; wy < height - 1; wy += 1.6)
                for (let wx = -0.7; wx <= 0.7; wx += 0.7)
                  box(building, 0.15, 0.25, 0.025, mat(0xf6d98b), wx, wy, 1.02);
            } else if (road === 'Village') {
              const trunk = box(scene, 0.28, 2, 0.28, mat(0x65452d), x, 1, z);
              trunk.userData.flow = true;
              moving.push(trunk);
              const crown = new THREE.Mesh(
                new THREE.SphereGeometry(1.2, 18, 14),
                mat(i % 2 ? 0x3b6240 : 0x4c7047, 0.94)
              );
              crown.position.set(x, 3, z);
              crown.userData.flow = true;
              scene.add(crown);
              moving.push(crown);
              if (i % 5 === 0) {
                const house = box(
                  scene,
                  3,
                  1.7,
                  2,                  mat(0xcdb58d),
                  side * (14 + Math.random() * 2),
                  0.85,
                  z - 4
                );
                house.userData.flow = true;
                moving.push(house);
                const roof = new THREE.Mesh(
                  new THREE.ConeGeometry(2.2, 0.9, 4),
                  mat(0x9a4b32)
                );
                roof.position.set(house.position.x, 2.15, z - 4);
                roof.rotation.y = Math.PI / 4;
                roof.userData.flow = true;
                scene.add(roof);
                moving.push(roof);
              }
            } else {
              const pole = box(scene, 0.09, 5, 0.09, mat(0x5c6570), x, 2.5, z);
              pole.userData.flow = true;
              moving.push(pole);
              box(scene, 1, 0.12, 0.2, mat(0xe9e4c6), x, 5, z);
            }
          }
        }
        // Background traffic: generic Indian road vehicles with body, glass, wheels and tail lamps.
        const trafficPaints = [0xe8e8e4, 0xc92e32, 0x2d668b, 0xd9a63a, 0x30343a];
        const trafficGlass = mat(0x173748, 0.2, 0.2);
        const trafficBlack = mat(0x11151a, 0.4, 0.1);
        for (let i = 0; i < (road === 'Highway' ? 13 : 8); i++) {
          const traffic = new THREE.Group();
          const trafficWidth = i % 3 === 0 ? 1.85 : 1.55;
          const trafficLength = i % 3 === 0 ? 3.9 : 3.1;
          const trafficBody = mat(trafficPaints[i % trafficPaints.length], 0.3, 0.35);
          box(traffic, trafficWidth, 0.48, trafficLength, trafficBody, 0, 0.55, 0);
          box(traffic, trafficWidth * 0.78, 0.42, trafficLength * 0.42, trafficGlass, 0, 0.92, -0.12);
          for (const side of [-1, 1]) {
            for (const z of [-trafficLength * 0.32, trafficLength * 0.32]) {
              const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 12), trafficBlack);
              wheel.rotation.z = Math.PI / 2;
              wheel.position.set(side * trafficWidth * 0.5, 0.28, z);
              traffic.add(wheel);
            }
            const tail = box(traffic, 0.22, 0.11, 0.04, mat(0xff332b), side * 0.52, 0.61, -trafficLength / 2);
            tail.material.emissive = new THREE.Color(0x5c0805);
          }
          traffic.position.set((i % 2 ? -1 : 1) * (2.7 + (i % 3) * 1.2), 0, -35 - i * 42);
          traffic.userData.flow = true;
          traffic.userData.traffic = true;
          scene.add(traffic);
          moving.push(traffic);
        }
        // Roadside signs and street lights change by selected environment.
        for (let z = -25; z > -620; z -= 78) {
          for (const side of [-1, 1]) {
            const pole = box(scene, 0.1, road === 'City' ? 4.8 : 3.7, 0.1, mat(0x68747b), side * 10.5, road === 'City' ? 2.4 : 1.85, z);
            pole.userData.flow = true;
            moving.push(pole);
            if (road === 'City' || road === 'Highway') {
              const sign = box(scene, 1.8, 0.85, 0.12, mat(road === 'Highway' ? 0x16764d : 0x176b48), side * 10.5, road === 'City' ? 4.35 : 3.65, z);
              sign.userData.flow = true;
              moving.push(sign);
            }
          }
        }
        car = new THREE.Group();
        scene.add(car);
        const bodyMat = mat(paint, 0.22, 0.6),
          glass = new THREE.MeshPhysicalMaterial({
            color: 0x173748,
            roughness: 0.17,
            metalness: 0.25,
            transparent: true,
            opacity: 0.78,
          }),
          black = mat(0x11151a, 0.4, 0.1),
          chrome = mat(0xb9c8d5, 0.2, 0.8);
        const isSUV = carKind.includes('SUV') || carKind.includes('4x4');
        const width = isSUV ? 2.25 : 2.08,
          length = carKind.includes('Coupe') ? 4.15 : 4.55,
          roofHeight = isSUV ? 1.65 : 1.4;
        body = box(car, width, 0.58, length, bodyMat, 0, 0.68, 0);
        // More recognizable front fascia, grille, bumpers, mirrors and cockpit details.
        box(car, width * 0.88, 0.16, 0.24, black, 0, 0.58, length * 0.49);
        box(car, width * 0.42, 0.18, 0.035, chrome, 0, 0.68, length * 0.505);
        for (let grilleX = -0.28; grilleX <= 0.28; grilleX += 0.14) {
          box(car, 0.035, 0.14, 0.045, chrome, grilleX, 0.68, length * 0.51);
        }
        box(car, width * 0.9, 0.18, 0.22, black, 0, 0.43, length * 0.49);
        box(car, width * 0.9, 0.16, 0.2, black, 0, 0.42, -length * 0.49);
        box(car, 0.72, 0.12, 0.08, black, 0, 1.01, -0.3);
        box(car, 0.12, 0.18, 0.32, black, -width * 0.52, 0.94, 0.5);
        box(car, 0.12, 0.18, 0.32, black, width * 0.52, 0.94, 0.5);
        const dashboard = box(car, width * 0.72, 0.12, 0.28, black, 0, 1.12, 0.62);
        dashboard.name = 'cockpit-dashboard';
        box(car, 0.48, 0.08, 0.07, mat(0x31c9e8, 0.2, 0.2), 0, 1.19, 0.62);
        for (const seatX of [-0.42, 0.42]) {
          box(car, 0.42, 0.42, 0.38, black, seatX, 1.02, -0.25);
          box(car, 0.42, 0.4, 0.13, black, seatX, 1.23, -0.42);
        }
        const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 8, 18), black);
        steeringWheel.position.set(-0.48, 1.18, 0.45);
        steeringWheel.rotation.x = 0.3;
        car.add(steeringWheel);
        box(
          car,
          width * 0.87,
          0.15,
          length * 0.23,
          bodyMat,
          0,
          0.96,
          length * 0.34
        );
        box(
          car,
          width * 0.84,
          0.13,
          length * 0.2,
          bodyMat,
          0,
          0.9,
          -length * 0.38
        );
        box(
          car,
          width * 0.8,
          roofHeight - 0.55,
          length * 0.46,
          bodyMat,
          0,
          1.18,
          -0.25
        );
        box(car, width * 0.69, 0.43, length * 0.4, glass, 0, 1.48, -0.25);
        box(car, 1.45, 0.12, 0.25, black, 0, 1.06, 0.45);
        for (const side of [-1, 1])
          for (const z of [-1.35, 1.35]) {
            const tire = new THREE.Mesh(
              new THREE.CylinderGeometry(
                isSUV ? 0.43 : 0.38,
                isSUV ? 0.43 : 0.38,
                0.25,
                22
              ),
              black
            );
            tire.rotation.z = Math.PI / 2;
            tire.position.set(side * width * 0.49, 0.4, z);
            tire.castShadow = true;
            car.add(tire);
            const rim = new THREE.Mesh(
              new THREE.CylinderGeometry(0.22, 0.22, 0.27, 16),
              chrome
            );
            rim.rotation.z = Math.PI / 2;
            rim.position.copy(tire.position);
            car.add(rim);
          }
        const doorPivots: any[] = [];
        for (const side of [-1, 1])
          for (const z of [-0.78, 0.62]) {
            const pivot = new THREE.Group();
            pivot.position.set(side * width * 0.48, 0.73, z);
            car.add(pivot);
            box(pivot, 0.08, 0.55, 0.83, bodyMat, side * 0.03, 0, 0.4);
            box(pivot, 0.035, 0.19, 0.55, glass, side * 0.04, 0.34, 0.4);
            doorPivots.push({ pivot, side });
          }
        for (const side of [-1, 1]) {
          const lamp = box(
            car,
            0.43,
            0.15,
            0.07,
            mat(0xffffff, 0.2),
            side * 0.7,
            0.78,
            length / 2
          );
          lamp.material.emissive = new THREE.Color(0xffffff);
          lamp.material.emissiveIntensity = 1.8;
          const beam = new THREE.SpotLight(
            0xeaf7ff,
            headlights ? 8 : 0,
            35,
            Math.PI / 7,
            0.5,
            1.4
          );
          beam.position.set(side * 0.7, 0.8, length / 2);
          beam.target.position.set(side * 0.7, 0.1, length / 2 + 15);
          car.add(beam, beam.target);
          (car.userData.beams ??= []).push(beam);
        }
        for (const side of [-1, 1])
          box(
            car,
            0.4,
            0.14,            0.06,
            mat(0xff2222),
            side * 0.7,
            0.78,
            -length / 2
          );
        const ledMat = new THREE.MeshStandardMaterial({
          color: 0x00eaff,
          emissive: 0x00eaff,
          emissiveIntensity: 2,
        });
        for (const side of [-1, 1])
          ledMeshes.push(
            box(
              car,
              0.035,
              0.05,
              length * 0.78,
              ledMat,
              side * width * 0.49,
              0.34,
              0
            )
          );
        const under = new THREE.PointLight(0x00eaff, 2, 6);
        under.position.set(0, 0.2, 0);
        car.add(under);
        car.userData.under = under;
        car.userData.doors = doorPivots;
        car.userData.glass = glass;
        car.position.set(0, 0, 5);
        car.rotation.y = Math.PI;
        gameRef.current = {
          scene,
          camera,
          renderer,
          car,
          bodyMat,
          ledMeshes,
          moving,
          under,
          THREE,
        };
        let last = performance.now(),
          travel = 0;
        const animate = (now: number) => {
          if (!active) return;
          frame = requestAnimationFrame(animate);
          const dt = Math.min((now - last) / 1000, 0.04);
          last = now;
          const k = held.current;
          let s = gameRef.current?.speed || 0;
          if (k.gas) s = Math.min(nitro ? 55 : 38, s + (nitro ? 23 : 15) * dt);
          else s = Math.max(0, s - 2.1 * dt);
          if (k.brake) s = Math.max(0, s - 25 * dt);
          gameRef.current.speed = s;
          setSpeed(Math.round(s * 3.1));
          const target = (k.left ? 1 : 0) - (k.right ? 1 : 0);
          gameRef.current.steer =
            (gameRef.current.steer || 0) +
            (target - (gameRef.current.steer || 0)) * Math.min(1, dt * 5);
          car.rotation.y =
            Math.PI + gameRef.current.steer * 0.42 * Math.min(1, s / 6 + 0.2);
          car.position.x = THREE.MathUtils.clamp(
            car.position.x + gameRef.current.steer * s * 0.09 * dt,
            -5.3,
            5.3
          );
          const flow = s * dt * 1.8;
          moving.forEach((o: any) => {
            o.position.z += flow * (o.userData.traffic ? 0.42 : 1);
            if (o.position.z > 18) {
              o.position.z = o.userData.traffic ? -470 - Math.random() * 140 : -650;
              if (o.userData.traffic) o.position.x = (Math.random() < 0.5 ? -1 : 1) * (2.5 + Math.random() * 2.1);
            }
          });
          let p: any, l: any;
          if (cameraMode === 0) {
            p = new THREE.Vector3(car.position.x, 4.2, car.position.z + 8.6);
            l = new THREE.Vector3(car.position.x, 1, -14);
          } else if (cameraMode === 1) {
            p = new THREE.Vector3(car.position.x, 1.75, car.position.z + 1.15);
            l = new THREE.Vector3(car.position.x, 1.3, car.position.z - 15);
          } else {
            p = new THREE.Vector3(car.position.x, 10, car.position.z + 11);
            l = new THREE.Vector3(car.position.x, 0, car.position.z - 10);
          }
          camera.position.lerp(p, 0.09);
          camera.lookAt(l);
          renderer.render(scene, camera);
        };
        frame = requestAnimationFrame(animate);
      } catch (e) {
        console.error(e);
        if (mount.current)
          mount.current.innerHTML =
            '<div class="fallback">3D scene needs an internet connection and a modern browser. Reload to retry.</div>';
      }
    };
    start();
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
    // rebuild scene when vehicle/environment changes
  }, [carKind, road]);

  useEffect(() => {
    const g = gameRef.current;
    if (!g) return;
    g.bodyMat?.color?.set(paint);
  }, [paint]);
  useEffect(() => {
    const g = gameRef.current;
    if (!g) return;
    g.ledMeshes?.forEach((m: any) => (m.visible = led));
    if (g.under) g.under.intensity = led ? 2 : 0;
  }, [led]);
  useEffect(() => {
    const g = gameRef.current;
    if (!g) return;
    g.car?.userData?.beams?.forEach(
      (b: any) => (b.intensity = headlights ? 8 : 0)
    );
  }, [headlights]);
  useEffect(() => {
    const g = gameRef.current;
    if (!g) return;
    g.car?.userData?.doors?.forEach(
      (d: any) => (d.pivot.rotation.y = doors ? d.side * 0.82 : 0)
    );
  }, [doors]);
  useEffect(() => {
    const g = gameRef.current;
    if (!g) return;
    if (g.car?.userData?.glass)
      g.car.userData.glass.opacity = windows ? 0.2 : 0.78;
  }, [windows]);
  useEffect(() => {
    const g = gameRef.current;
    if (!g) return;
    g.ledMeshes?.forEach((m: any) => {
      m.material.color.set(ledColor);
      m.material.emissive.set(ledColor);
    });
    if (g.under) g.under.color.set(ledColor);
  }, []);
  const [ledColor, setLedColor] = useState('#00eaff');
  useEffect(() => {
    const g = gameRef.current;
    if (!g) return;
    g.ledMeshes?.forEach((m: any) => {
      m.material.color.set(ledColor);
      m.material.emissive.set(ledColor);
    });
    if (g.under) g.under.color.set(ledColor);
  }, [ledColor]);
  const hold = (key: keyof typeof held.current, on: boolean) => {
    held.current[key] = on;
  };
  const toggleMusic = () => {
    try {
      const a = audio.current;
      if (!a.ctx) {
        a.ctx = new AudioContext();
        a.osc = a.ctx.createOscillator();
        a.gain = a.ctx.createGain();
        a.osc.type = 'triangle';
        a.osc.frequency.value = 110;
        a.gain.gain.value = 0;
        a.osc.connect(a.gain);
        a.gain.connect(a.ctx.destination);
        a.osc.start();
      }
      if (a.ctx.state === 'suspended') void a.ctx.resume();
      const next = !music;
      setMusic(next);
      a.gain!.gain.setTargetAtTime(next ? 0.035 : 0, a.ctx.currentTime, 0.1);
      say(next ? 'DJ synth music on' : 'Music muted');
    } catch {
      say('Audio is not supported in this browser');
    }
  };
  const horn = () => {
    try {
      const c = new AudioContext(),
        o = c.createOscillator(),
        g = c.createGain();
      o.frequency.value = 430;
      g.gain.value = 0.12;
      o.connect(g);
      g.connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.22);
      o.onended = () => void c.close();
    } catch {}    say('HONK!');
  };
  const enterLandscape = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
      if (orientation.lock) await orientation.lock('landscape');
      say('Landscape mode enabled');
    } catch {
      say('Phone ko landscape mein rotate karein');
    }
  };
  const switchCamera = () => {
    setCameraMode(v => (v + 1) % 3);
    say(
      ['Chase camera', 'Cockpit-style camera', 'High camera'][
        (cameraMode + 1) % 3
      ]
    );
  };
  const setVehicle = (v: string) => setCarKind(v as CarKind);
  return (
    <main className="game-shell">
      <div ref={mount} className="scene" />
      <header className="hud">
        <div className="brand">
          INDIA DRIVE <span>REAL CAR SIM</span>
        </div>
        <div className="speedbox">
          <b>{speed}</b>
          <small>KM/H</small>
        </div>
        <div className="roadtag">🇮🇳 {road.toUpperCase()}</div>
        <button className="landscape-button" onClick={enterLandscape}>⛶ LANDSCAPE</button>
      </header>
      <aside className="garage">
        <h2>🚘 GARAGE</h2>
        <label>Choose your car</label>
        <select value={carKind} onChange={e => setVehicle(e.target.value)}>
          <option>Thar-style 4x4</option>
          <option>Fortuner-style SUV</option>
          <option>BMW-style Coupe</option>
          <option>Mercedes-style Sedan</option>
        </select>
        <label>Indian road</label>
        <select value={road} onChange={e => setRoad(e.target.value as Road)}>
          <option>Village</option>
          <option>City</option>
          <option>Highway</option>
        </select>
        <label>Car paint</label>
        <div className="swatches">
          {colors.map(c => (
            <button
              key={c}
              aria-label={'Paint ' + c}
              className="swatch"
              style={{ background: c }}
              onClick={() => setPaint(c)}
            />
          ))}
        </div>
        <label>RGB LED colour</label>
        <input
          aria-label="RGB LED colour"
          type="color"
          value={ledColor}
          onChange={e => setLedColor(e.target.value)}
        />
        <div className="actions">
          <button onClick={() => setLed(v => !v)}>
            {led ? '🌈 LED ON' : '🌈 LED OFF'}
          </button>
          <button onClick={() => setHeadlights(v => !v)}>
            {headlights ? '🔦 Lights ON' : '🔦 Lights OFF'}
          </button>
          <button onClick={() => setHazard(v => !v)}>
            {hazard ? '⚠️ Hazard ON' : '⚠️ Hazard OFF'}
          </button>
          <button
            onClick={() => {
              setDoors(v => !v);
              say(doors ? 'Doors closed' : 'Doors opened');
            }}
          >
            {doors ? '🚪 Close doors' : '🚪 Open doors'}
          </button>
          <button
            onClick={() => {
              setWindows(v => !v);
              say(windows ? 'Windows up' : 'Windows down');
            }}
          >
            {windows ? '🪟 Windows up' : '🪟 Windows down'}
          </button>
          <button onClick={toggleMusic}>
            {music ? '🎵 Music OFF' : '🎵 DJ Music ON'}
          </button>
          <button onClick={horn}>📣 Horn</button>
          <button
            onClick={() => {
              setNitro(v => !v);
              say(nitro ? 'Nitro off' : 'Nitro boost on');
            }}
          >
            {nitro ? '⚡ Nitro OFF' : '⚡ Nitro'}
          </button>
          <button onClick={switchCamera}>📷 Camera</button>
          <button
            onClick={() => {
              held.current = {
                left: false,
                right: false,
                gas: false,
                brake: false,
              };
              setNitro(false);
              setSpeed(0);
              say('Car reset');
            }}
          >
            ↻ Reset
          </button>
        </div>
        <p className="note">
          Original 3D prototype • vehicle shapes are generic, not licensed
          factory models. Music is synthesized.
        </p>
      </aside>
      <div className="toast">{toast}</div>
      <footer className="driving-controls">
        <div className="steer">
          <button
            onPointerDown={e => {
              e.preventDefault();
              hold('left', true);
            }}
            onPointerUp={() => hold('left', false)}
            onPointerLeave={() => hold('left', false)}
            onPointerCancel={() => hold('left', false)}
          >
            ◀<small>LEFT</small>
          </button>
          <button
            onPointerDown={e => {
              e.preventDefault();
              hold('right', true);
            }}
            onPointerUp={() => hold('right', false)}
            onPointerLeave={() => hold('right', false)}
            onPointerCancel={() => hold('right', false)}
          >
            ▶<small>RIGHT</small>
          </button>
        </div>
        <div className="pedals">
          <button
            className="brake"
            onPointerDown={e => {
              e.preventDefault();
              hold('brake', true);
            }}
            onPointerUp={() => hold('brake', false)}
            onPointerLeave={() => hold('brake', false)}
            onPointerCancel={() => hold('brake', false)}
          >
            BRAKE<small>HOLD</small>
          </button>
          <button
            className="gas"
            onPointerDown={e => {
              e.preventDefault();
              hold('gas', true);
            }}
            onPointerUp={() => hold('gas', false)}
            onPointerLeave={() => hold('gas', false)}
            onPointerCancel={() => hold('gas', false)}
          >
            ACCEL<small>HOLD</small>
          </button>
        </div>
      </footer>
    </main>
  );
}
