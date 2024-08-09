import * as THREE from 'three';
import { heightBp, heightBreakpoints } from './heightBreakpoints.js';

export class Sprite{
    constructor(id:string, texture: THREE.Texture, url: string, scaleFactor: number, sizeClass: heightBp, position : THREE.Vector3){
        this.id = id;
        this.pos = new THREE.Vector3(0,0,0);
        this.targetPos = null;
        this.height = scaleFactor;
        this.sizeClass = sizeClass;
        
        console.log(`height: ${scaleFactor}`);
        console.log(`size: ${this.sizeClass.size}, base diam: ${this.sizeClass.baseDiameter}`);

        this.spriteUrl = url;

        this.base = makeSpriteBase(this.sizeClass);
        this.sprite = makeSprite(texture, scaleFactor);

        this.group = new THREE.Group();

        this.group.add(this.base);
        this.group.add(this.sprite);
        this.group.position.copy(position);
    }

    public pos : THREE.Vector3;
    public targetPos : THREE.Vector3 | null;
    public id : string;
    public group: THREE.Group;
    public base: THREE.Mesh;
    public sprite: THREE.Mesh;
    public spriteUrl: string;
    public sizeClass: heightBp;
    public height: number;
}

const makeSpriteBase = (size: heightBp) : THREE.Mesh => {
    const baseGeo = new THREE.CylinderGeometry((size.baseDiameter/2)- 0.05 , size.baseDiameter/2, .1, 30, 32);
    const baseMat = new THREE.MeshBasicMaterial({color: 0x000000, transparent: true});
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.translateY(.051);

    return base;
}

const makeSprite = (texture : THREE.Texture, height: number) : THREE.Mesh => {
    const geo = new THREE.PlaneGeometry(height, height);
    const mat = new THREE.MeshBasicMaterial({map:texture, transparent: true});
    const sprite = new THREE.Mesh(geo, mat);
    sprite.translateY(height/2 + .05);

    return sprite;
}

export const loadSpriteTexture = (url :string) : Promise<THREE.Texture> =>{
    return new Promise((resolve, reject) => {
        const texLoader = new THREE.TextureLoader();
        texLoader.load(url, function(texture){
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            resolve(texture);
        }, (error) => {
            reject(error);
        });
    })
}