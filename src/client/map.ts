import * as THREE from 'three';
import { clientSceneConfig, clientShaders, initializeSceneConfig, intitializeClientShaders, sceneObjects } from './initialization.js';
import { jankVector3, mapData, message, newSprite } from '../shared/messages.js';
import { Sprite } from 'src/shared/sprite.js';
import { addChar, initSocketListensers } from './messageHandlin.js';
import { guiState, initGui } from './gui.js';
import { animLoopMouseInteraction, mouseDownEvent, mouseUpEvent, pointerMoveEvent } from './clientSideInteraction.js';

const initConfigureScene = () => {
    const sceneConf = initializeSceneConfig();
    const shaderConf = intitializeClientShaders(sceneConf);

    window.addEventListener('resize', () => onWindowResize(sceneConf, shaderConf), false);

    loadMap(sceneConf, shaderConf); // loads in map texture async, calls finish init to go back to sync
}

const animate = (sceneConf: Readonly<clientSceneConfig>, shaderConf : Readonly<clientShaders>, objs : sceneObjects, guiState : guiState) => {
    requestAnimationFrame(() => animate(sceneConf, shaderConf, objs, guiState));

    rotateAllSprites(sceneConf, objs);
    animLoopMouseInteraction(sceneConf, shaderConf, objs, guiState);
    lerpAllSprites(objs);

    sceneConf.controls.update();
    sceneConf.renderer.render(sceneConf.scene, sceneConf.camera);
    shaderConf.composer.render();
}

// @ts-ignore
const mapDataRequest = async () : Promise<mapData> => {
    try{
        const response = await fetch('http://localhost:8080/mapData', {
            method: 'GET',
            redirect: 'error',
        });

        if(!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json() as mapData;

        return data;
    }catch (error) {
        console.error('Error in fetch map data', error);
    }
}

// @ts-ignore
const spriteDataRequest = async () : Promise<Array<newSprite>> => {
    try{
        const response = await fetch('http://localhost:8080/spriteData', {
            method: 'GET',
            redirect: 'error',
        });

        if(!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json() as Array<newSprite>;

        return data;
    }catch (error) {
        console.error('Error in fetch map data', error);
    }
}

const loadMap = (conf : clientSceneConfig, shaders: clientShaders) => {
    let sceneObjs = {};
    mapDataRequest().then(async (data) => {
        const objs = await buildMap(conf, data, sceneObjs);
        finishInit(conf, shaders, objs); 
    });
}

const buildMap = (conf : clientSceneConfig, data : mapData, objs : object) : Promise<sceneObjects> => {
    console.log(objs);
    return new Promise((resolve, _reject) => {
        const textureLoader = new THREE.TextureLoader();

        let image = new Image();
        let width: number, height: number;

        image.onload = () => {
            width = image.width / data.scaleFactor;
            height = image.height / data.scaleFactor;

            textureLoader.load(data.imgUrl, (texture) => {
                const planeGeo = new THREE.BoxGeometry(width, 1, height);
                const planeMat = new THREE.MeshBasicMaterial({ map: texture });
                const base = new THREE.Mesh(planeGeo, planeMat);
                base.translateY(-.5);
                conf.scene.add(base);

                const sceneObjs: sceneObjects = {
                    base: base,
                    charSprites: {},
                    currHoveringId: null,
                    movingSpriteTelemetry: null,
                    raycaster: new THREE.Raycaster(),
                    mousePosition: new THREE.Vector2()
                };

                resolve(sceneObjs);
            });
        };
        image.src = data.imgUrl;
    });
}

const rotateAllSprites = (sceneConf: clientSceneConfig, sceneObjs: sceneObjects) => {
    Object.values(sceneObjs.charSprites).forEach(sprite => {
        sprite.sprite.lookAt(sceneConf.camera.position);
    })
}

const lerpAllSprites = (objs : sceneObjects) => {
    const speed = 0.1;
    Object.values(objs.charSprites).forEach(sprite => {
        if(sprite.targetPos){
            if(sprite.group.position.distanceTo(sprite.targetPos) > 0.05){
                sprite.group.position.lerp(sprite.targetPos, speed);
            }else{
                sprite.targetPos = null;
            }
        }
    });
}

const finishInit = (sceneConf: clientSceneConfig, shaderConf: clientShaders, objs: sceneObjects) => {
    const guiState = initGui();
    initSocketListensers(sceneConf, objs, guiState);

    document.addEventListener( 'pointermove', (e : MouseEvent) => pointerMoveEvent(e, objs, guiState, sceneConf, shaderConf) );
    document.addEventListener( 'mousedown', (e : MouseEvent) => mouseDownEvent(e, objs, guiState, sceneConf));
    document.addEventListener( 'mouseup', (e : MouseEvent) => mouseUpEvent(guiState, objs, sceneConf));

    //document.addEventListener('keydown', onKeyPress);

    spriteDataRequest().then(async (spriteArray) => {
        spriteArray.forEach(spriteInitializer => {
            console.log(`got sprite from server at pos: ${spriteInitializer.position.x}`);
            addChar(spriteInitializer, objs, sceneConf, guiState, spriteInitializer.sizeClass);
        });
        animate(sceneConf, shaderConf, objs, guiState);
    });
}

const onWindowResize = (conf: clientSceneConfig, shader: clientShaders) => {
  conf.camera.aspect = window.innerWidth / window.innerHeight;
  conf.camera.updateProjectionMatrix();

  conf.renderer.setSize(window.innerWidth, window.innerHeight);
  shader.composer.setSize(window.innerWidth, window.innerHeight);
}

initConfigureScene();