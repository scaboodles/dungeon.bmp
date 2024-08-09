import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { OutlineController } from './shaderController.js';
import { Sprite } from 'src/shared/sprite.js';

export type clientSceneConfig = {
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    controls: OrbitControls,
    socket: WebSocket
}

export type clientShaders = {
    composer: EffectComposer,
    effectFXAA: ShaderPass, 
    outlinePass: OutlinePass,
    outlineController: OutlineController
}

export type sceneObjects = {
    base : THREE.Mesh,
    charSprites : {[key: string] : Sprite},
    currHoveringId : string | null,
    raycaster: THREE.Raycaster,
    movingSpriteTelemetry : movingSprite | null,
    mousePosition: THREE.Vector2
}

export type movingSprite = {
    clonedGroup : THREE.Group,
    line : THREE.Line,
    ogSprite : Sprite,
    axis : 'x' | 'y',
    yMovementPlane : null | THREE.Plane
}

export const initializeSceneConfig = () : Readonly<clientSceneConfig> => {

    const scene = new THREE.Scene();

    // init cam
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // init renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);


    // init controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enableZoom = true;

    controls.keyPanSpeed = 50.0;

    controls.keys = {
        UP: 'KeyW',
        LEFT: 'KeyA',
        BOTTOM: 'KeyS',
        RIGHT: 'KeyD'
    }

    controls.mouseButtons = {
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
    }

    controls.listenToKeyEvents(window);

    const socket = new WebSocket('ws://localhost:8080');

    const conf : clientSceneConfig = {
        scene: scene,
        camera: camera,
        renderer: renderer,
        controls: controls,
        socket: socket
    };

    return conf;
}

export const intitializeClientShaders = (sceneConfig : clientSceneConfig) : Readonly<clientShaders> => {
    const composer = new EffectComposer( sceneConfig.renderer );

    const renderPass = new RenderPass( sceneConfig.scene, sceneConfig.camera );
    composer.addPass( renderPass );

    const outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), sceneConfig.scene, sceneConfig.camera);

    const outlineControl = new OutlineController(outlinePass);

    composer.addPass( outlinePass );

    const outputPass = new OutputPass();
    composer.addPass( outputPass );

    const effectFXAA = new ShaderPass( FXAAShader );
    effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
    composer.addPass( effectFXAA );

    const conf = {
        composer: composer,
        effectFXAA: effectFXAA, 
        outlinePass: outlinePass,
        outlineController: outlineControl
    };

    return conf;
}