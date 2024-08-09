import * as THREE from 'three';

export const addCharacter = (png: string) => {
    const group = new THREE.Group();

    const baseGeo = new THREE.CylinderGeometry(.45, .5, .1, 30, 32);
    const baseMat = new THREE.MeshBasicMaterial({color: 0x000000, transparent: true});
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.translateY(.051);
    group.add(base);

    let sprite;

    const texLoader = new THREE.TextureLoader();

    texLoader.load(png, function(texture){
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;

        const geo = new THREE.PlaneGeometry(1,1);
        const mat = new THREE.MeshBasicMaterial({map:texture, transparent: true});

        sprite = new THREE.Mesh(geo, mat);
        sprite.translateY(.55);
        group.add(sprite);
    });
}