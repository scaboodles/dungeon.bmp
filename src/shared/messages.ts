import * as THREE from 'three';
import { heightBp } from './heightBreakpoints.js';

// websocket message types

export type mapData = {
    type: "mapData",
    imgUrl: string,
    scaleFactor: number
}

export type spriteMove = {
    type: "spriteMove",
    id: string,
    newPos: THREE.Vector3
}

export type newSprite = {
    type: "newSprite",
    id: string,
    imgUrl: string,
    scaleFactor: number,
    sizeClass: heightBp,
    position: jankVector3
}

export type jankVector3 = {
    'x' : number,
    'y' : number,
    'z' : number
}

//export type

export type message = mapData | spriteMove | newSprite; // websocket message types are not used by post reqests