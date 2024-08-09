import { Sprite } from 'src/shared/sprite.js';
import * as THREE from 'three';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

export class OutlineController{
    constructor(outlinePass : OutlinePass){
        this.outlinePass = outlinePass;
        this.currHighlighted = [];
        this.initializeOutlinePass();
    }

    private outlinePass : OutlinePass;
    private currHighlighted: THREE.Object3D[];

    
    private initializeOutlinePass = () => {
        const outlineParams = {
            edgeStrength: 5.0,
            edgeGlow: 0.0,
            edgeThickness: 1.0,
            pulsePeriod: 1.5,
            rotate: false,
            usePatternTexture: false
        };

        const outlineSpecialParams = {
            visibleEdgeColor: '#ffffff',
            hiddenEdgeColor: '#ffffff'
        };

        Object.entries(outlineParams).forEach(([key,value]) => {
            // @ts-ignore
            this.outlinePass[key] = value;
        });
        Object.entries(outlineSpecialParams).forEach(([key,value]) => {
            // @ts-ignore
            this.outlinePass[key].set(value);
        });
    }

    public addObject = (obj: THREE.Object3D) => {
        this.currHighlighted.push(obj);
    }

    public addManyObjects = (objs: THREE.Object3D[]) => {
        const combo = [...this.currHighlighted, ...objs];
        this.currHighlighted = combo;
        this.updateOutlinedObjects();
    }

    public setOutlineColor = (visibleColor : string, invisibleColor = visibleColor) => {
        this.outlinePass.visibleEdgeColor.set(visibleColor);
        this.outlinePass.hiddenEdgeColor.set(invisibleColor);
    }

    public exclusivelyHighlightObject3d = (obj: THREE.Object3D) => {
        this.currHighlighted = [obj];
        this.updateOutlinedObjects();
    }

    public exclusivelyHighlightObject3dArray = (objs : THREE.Object3D[]) => {
        this.currHighlighted = objs;
        this.updateOutlinedObjects();
    }

    public exclusivelyHighlightSprite = (sprite : Sprite) => {
        this.currHighlighted = sprite.group.children;
        this.updateOutlinedObjects();
    } 

    public exclusivelyHighlightSpriteArray = (sprites : Sprite[]) => {
        sprites.forEach(sprite => {
            this.addManyObjects(sprite.group.children)
        });
        this.updateOutlinedObjects();
    } 

    public purgeHighlighted = () => {
        this.currHighlighted = [];
        this.updateOutlinedObjects();
    }

    private updateOutlinedObjects = () => {
        this.outlinePass.selectedObjects = this.currHighlighted;
    }
}