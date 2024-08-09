import * as THREE from 'three';
import { guiState } from "./gui.js";
import { clientSceneConfig, clientShaders, sceneObjects, movingSprite } from "./initialization.js";
import { Sprite } from 'src/shared/sprite.js';
import { spriteMove } from 'src/shared/messages.js';

export const spriteIdError = '-1';

export const animLoopMouseInteraction = (sceneConf : clientSceneConfig, shaderConf : clientShaders, objs : sceneObjects, gui : guiState) => {
    if(gui.mode === 'gripper'){
        interactionMoveSprite(objs, sceneConf);
    }
}

const interactionMoveSprite = (objs: sceneObjects, conf : clientSceneConfig) => {
    if(objs.movingSpriteTelemetry == null){
        return;
    }

    objs.raycaster.setFromCamera( objs.mousePosition, conf.camera );

    const moving = objs.movingSpriteTelemetry;
    const ogPos = new THREE.Vector3();
    moving.ogSprite.group.getWorldPosition(ogPos);

    const clonePos = new THREE.Vector3();
    moving.clonedGroup.getWorldPosition(clonePos);

    // update line positions (clone to raycast point)
    const positions = moving.line.geometry.attributes.position.array;

    const raycaster = objs.raycaster;
    if(moving.axis == 'x'){
        const intersects = raycaster.intersectObject( objs.base );
        if ( intersects.length > 0 ){
            const intersectPoint = intersects[0];

            moving.ogSprite.targetPos = new THREE.Vector3(intersectPoint.point.x, ogPos.y, intersectPoint.point.z);

            // from clone
            positions[0] = clonePos.x;
            positions[1] = clonePos.y;
            positions[2] = clonePos.z;
        
            // to raycast
            positions[3] = intersectPoint.point.x;
            positions[4] = ogPos.y;
            positions[5] = intersectPoint.point.z;

            //update distance readout
            //updateDistanceReadout(clonePos.distanceTo(intersectPoint.point));

            // line needs update
            moving.line.geometry.attributes.position.needsUpdate = true;
        }
    }else{
        const yPlaneIntersect = new THREE.Vector3();
        // @ts-ignore
        raycaster.ray.intersectPlane(moving.yMovementPlane, yPlaneIntersect);

        const newYPos = yPlaneIntersect.y >= 0 ? yPlaneIntersect.y : 0;
        moving.ogSprite.targetPos = new THREE.Vector3(ogPos.x, newYPos, ogPos.z);

        // from clone
        positions[0] = clonePos.x;
        positions[1] = clonePos.y;
        positions[2] = clonePos.z;
    
        // to raycast
        positions[3] = ogPos.x;
        positions[4] = newYPos;
        positions[5] = ogPos.z;

        //update distance readout
        //updateDistanceReadout(clonePos.distanceTo(movingClone.target));

        // line needs update
        moving.line.geometry.attributes.position.needsUpdate = true;
    }
}

/*
        const ogPos = new THREE.Vector3();
        objs.movingSpriteTelemetry.ogSprite.group.getWorldPosition(ogPos);

        // update line positions
        const positions = objs.movingSpriteTelemetry.line.geometry.attributes.position.array;

        positions[6] = ogPos.x;
        positions[7] = ogPos.y;
        positions[8] = ogPos.z;
    
        // line needs update
        objs.movingSpriteTelemetry.line.geometry.attributes.position.needsUpdate = true;
*/

export const mouseDownEvent = (e: MouseEvent, objs : sceneObjects, gui : guiState, conf : clientSceneConfig) => {
    const mode = gui.mode;
    if(e.button == 0){
        if(mode == 'gripper'){
            startMoveCharacter('x', objs, conf);
        }
    }
    else if (e.button == 2){
        if(mode == 'gripper'){
            startMoveCharacter('y', objs, conf);
        }
    }
}

export const mouseUpEvent = (gui : guiState, objs : sceneObjects, conf : clientSceneConfig) => {
    if(objs.movingSpriteTelemetry){
        finishSpriteMove(objs, conf);
    }
}

const finishSpriteMove = (objs : sceneObjects, conf : clientSceneConfig) => {
    if(objs.movingSpriteTelemetry){
        const tele = objs.movingSpriteTelemetry;
        const clone = tele.clonedGroup;
        clone.children.forEach((child) => {
            conf.scene.remove(child);
            // @ts-ignore
            child.material.dispose();
            // @ts-ignore
            child.geometry.dispose();
        });

        const og = tele.ogSprite;

        conf.scene.remove(clone);

        const line = tele.line;
        conf.scene.remove(line);
        // @ts-ignore
        line.material.dispose();
        line.geometry.dispose();

        const target = og.targetPos;
        if(target){
            const message : spriteMove = {
                type: 'spriteMove',
                id: og.id,
                newPos: target
            }

            conf.socket.send(JSON.stringify(message));
        }

        objs.movingSpriteTelemetry = null;
    }
}

export const pointerMoveEvent = (e: MouseEvent, objs : sceneObjects, gui : guiState, conf : clientSceneConfig, shaderConf : clientShaders) => { 
    objs.mousePosition.x = ( e.clientX / conf.renderer.domElement.clientWidth ) * 2 - 1;
    objs.mousePosition.y = - ( e.clientY / conf.renderer.domElement.clientHeight ) * 2 + 1;
    if(objs.movingSpriteTelemetry){
        return
    }
    // dont need to do this while we are currently moving a sprite
    // check intersection in event, actual interaction happens in anim loop
    objs.raycaster.setFromCamera( objs.mousePosition, conf.camera );
    const spriteGroups = getSpriteGroupArray(objs);
    const intersection = objs.raycaster.intersectObjects(spriteGroups);
    if(intersection.length > 0) {
        const intersectedObject : THREE.Object3D = intersection[0].object;
        const spriteId = getSpriteIdFromMesh(intersectedObject, objs);
        const hoveredSprite : Sprite = objs.charSprites[spriteId];
        objs.currHoveringId = spriteId;

        shaderConf.outlineController.exclusivelyHighlightSprite(hoveredSprite);
    }else{
        shaderConf.outlineController.purgeHighlighted();
        objs.currHoveringId = null;
    }
}

const getSpriteIdFromMesh = (mesh : THREE.Object3D, objs : sceneObjects) : string => {
    for (const [spriteId, sprite] of Object.entries(objs.charSprites)) {
        if(meshInGroup(mesh, sprite.group)){
            console.log(`found matching sprite id: ${spriteId}`);
            return spriteId;
        }
    }
    return spriteIdError;
}

const meshInGroup = (mesh: THREE.Object3D, group: THREE.Group) => {
    for (let i = 0; i < group.children.length; i++) {
        if (group.children[i] === mesh) {
            return true;
        }
    }
    return false;
}

const getSpriteGroupArray = (objs : sceneObjects) : THREE.Group[] => {
    const groupArray: Array<THREE.Group> = [];
    Object.values(objs.charSprites).forEach(sprite => {
        groupArray.push(sprite.group)
    });
    return groupArray;
}

const startMoveCharacter = (axis: 'x' | 'y', objs : sceneObjects, conf : clientSceneConfig) => {
    console.log('mouse down event');
    if(objs.currHoveringId){ 
        console.log('currently hovering over sprite');
        const hoveredSprite = objs.charSprites[objs.currHoveringId];
        let group = hoveredSprite.group;
        const cloneGroup = group.clone();
        cloneGroup.children.forEach((child) => {
            const mesh = child as THREE.Mesh;
            if(mesh.material){
                // @ts-ignore
                mesh.material = mesh.material.clone(); 
                // @ts-ignore
                mesh.material.opacity = .4;
                // @ts-ignore
                mesh.material.needsUpdate = true;
            }
        });

        const groupPos = new THREE.Vector3(group.position.x, group.position.y, group.position.z);


        const points = [ new THREE.Vector3(cloneGroup.position.x, cloneGroup.position.y, cloneGroup.position.z), 
                        new THREE.Vector3(group.position.x, 0, group.position.z), 
                        groupPos];

        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        const line = new THREE.Line(lineGeo, lineMat);

        const movingSprite : movingSprite = {
            clonedGroup: cloneGroup, 
            line: line, 
            ogSprite: hoveredSprite, 
            axis : axis, 
            yMovementPlane: null
        };

        if(axis === 'y'){
            const planeNormal = new THREE.Vector3();
            conf.camera.getWorldDirection(planeNormal);
            const plane = new THREE.Plane(planeNormal, 0);
            movingSprite.yMovementPlane = plane;
        }

        objs.movingSpriteTelemetry = movingSprite;

        conf.scene.add(cloneGroup);
        conf.scene.add(line);
    }
}
