import { jankVector3, message, newSprite } from "../shared/messages.js";
import * as THREE from 'three';
import { clientSceneConfig, sceneObjects } from "./initialization.js";
import { loadSpriteTexture, Sprite } from "../shared/sprite.js";
import { guiState, rebuildActiveSprites } from "./gui.js";
import { heightBp } from "src/shared/heightBreakpoints.js";
import { temp } from "three/examples/jsm/nodes/Nodes.js";

export const initSocketListensers = (conf: clientSceneConfig, objs : sceneObjects, guiState : guiState) =>{
    conf.socket.addEventListener('message', function (event) {
        const msg:message = JSON.parse(event.data.toString());
        if(msg.type == 'newSprite'){
            addChar(msg, objs, conf, guiState, msg.sizeClass);
        }else if(msg.type == 'spriteMove'){
            objs.charSprites[msg.id].targetPos = msg.newPos;
        }
    });
}

export const addChar = (initSpriteMessage : newSprite, objs : sceneObjects, conf : clientSceneConfig, guiState : guiState, sizeClass : heightBp) => {
    if(!(initSpriteMessage.id in objs.charSprites)){
        ( async () => {
            try{
                const texture : THREE.Texture = await loadSpriteTexture(initSpriteMessage.imgUrl);
                const tempVector : jankVector3 = initSpriteMessage.position;
                const sprite = new Sprite(initSpriteMessage.id, texture, initSpriteMessage.imgUrl, initSpriteMessage.scaleFactor, sizeClass, new THREE.Vector3(tempVector.x, tempVector.y, tempVector.z));

                objs.charSprites[initSpriteMessage.id] = sprite;
                console.log(sprite.group);
                conf.scene.add(sprite.group);

                rebuildActiveSprites(guiState, objs);
            }catch(error){
                console.error("failed to load texure from url: ", error);
            }
        })();
    }
}