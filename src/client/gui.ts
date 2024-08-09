import * as THREE from 'three';
import { GUI, FunctionController, Controller, NumberController, OptionController } from 'three/addons/libs/lil-gui.module.min.js';
import addSpriteButton from './assets/addSprite.png';
import moveStatic from './assets/gripper.png';
import moveActive from './assets/gripperSelected.gif';
import '../styling/gui.css';
import { Sprite } from '../shared/sprite.js';
import { feetInchesToGameUnit, getHeightBpFromHeight, getHeightBpFromSizeCategory, heightBp, sizeCategories, sizeCategory } from '../shared/heightBreakpoints.js';
import { sceneObjects } from './initialization.js';

type toolkitElement = {
    [key: string] : {
        controller : FunctionController<any, any>,
        staticImgUrl : string,
        activeImgUrl : string,
    }
}


type toolkitMode = 'none' | 'gripper';

export type guiState = {
    toolkit: GUI,
    spriteDisplay: GUI,
    activeSprites: GUI,
    toolkitElements : toolkitElement,
    mode : toolkitMode
}

export const initGui = () : guiState => {
    console.log('init gui');
    const toolkitGui = new GUI({injectStyles: false, title: "toolkit"});
    toolkitGui.domElement.id = "toolkit";

    const spriteDisplay = new GUI({injectStyles: false, title: "active sprites"});
    spriteDisplay.domElement.id = "spriteDisplay";
    const activeSprites = spriteDisplay.addFolder('');

    createFileInput(spriteDisplay);

    const guiState: guiState = {
        toolkit: toolkitGui,
        spriteDisplay: spriteDisplay,
        activeSprites: activeSprites,
        toolkitElements: {},
        mode: 'none'
    };

    const toolkitFuncs: {[key: string] : () => void} = {
        'test': () => console.log('test'),
        'addSprite': () => {
            const fileInput = document.getElementById('hiddenFileInput') as HTMLInputElement;
            if (fileInput) {
                fileInput.click();
            }
        },
        'move': () => {
            const tkElem = guiState.toolkitElements.move;
            setGuiImage(tkElem.controller, tkElem.activeImgUrl);
            guiState.mode = 'gripper';
        }
    }

    guiState.toolkitElements['addSprite'] = {controller: spriteDisplay.add(toolkitFuncs, 'addSprite').name(''), staticImgUrl: addSpriteButton, activeImgUrl: addSpriteButton};
    guiState.toolkitElements['move'] = {controller: toolkitGui.add(toolkitFuncs, 'move').name(''), staticImgUrl: moveStatic, activeImgUrl: moveActive};

    /*
        above line(s) need explaination:

        gui.add() returns a function controller element -> gets saved in toolkit elements to do stuff like changing background image
        set .name to empty string so that text doesnt show up over images
        static/active img urls are used to reflect current gui mode

        setting ids and classes to use css in gui.css
    */

    Object.values(guiState.toolkitElements).forEach( ( elem) => {
        addGuiClass(elem.controller, 'toolkitUiElement');
        setGuiImage(elem.controller, elem.staticImgUrl);
    });

    return guiState;
}

const updateToolkitIconsToMode = (guiState : guiState) => {
    if(guiState.mode in guiState.toolkitElements){
        const prevMode = guiState.toolkitElements[guiState.mode];
        // fixme, pickup here
        
    }
}

const createFileInput = (gui: GUI) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    fileInput.id = 'hiddenFileInput';
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', (event) => handleFileSelect(event, gui));
}

type height = {
    feet: number,
    inches: number
}

const handleFileSelect = (event: Event, gui: GUI) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0] && input.files[0].type.startsWith('image/')) {
        const file = input.files[0];

        const uploadGui = gui.addFolder("add character");
        uploadGui.domElement.id = "addCharPopup";

        const selfDestruct = () => uploadGui.destroy();

        const spriteHeight : height = {
            feet: 5,
            inches: 0 
        }

        const sizeCategoryDropdown : {[key: string] : sizeCategory}= {
            sizeCategory : 'medium'
        }

        const toggle = {
            useExactHeight: false
        }

        const guiFuncs: {[key: string] : () => void} = {
            dummy: () => {}, // no op controller to add image (͠≖ ͜ʖ͠≖)
            cancel: () => selfDestruct(),
            confirm: () => {
                if(toggle.useExactHeight){
                    const height = feetInchesToGameUnit(spriteHeight.feet, spriteHeight.inches);
                    uploadCharImage(file, height, getHeightBpFromHeight(height));
                }else{
                    console.log(sizeCategoryDropdown.sizeCategory);
                    const heightBp = getHeightBpFromSizeCategory(sizeCategoryDropdown.sizeCategory);
                    console.log(heightBp);
                    uploadCharImage(file, heightBp.defaultHeight, heightBp);
                }

                selfDestruct();
            }
        }


        const dummyController = uploadGui.add(guiFuncs, 'dummy').name('');
        addGuiClass(dummyController, 'toolkitUiElement');
        setGuiImage(dummyController, URL.createObjectURL(file));

        uploadGui.add(toggle, 'useExactHeight').name('use exact height').onChange(toggled => {
            if(toggled){
                hideSizeShowFeetInches();
            }else{
                hideFeetInchesShowSize();
            }
        })

        const feetController = uploadGui.add(spriteHeight, 'feet');
        const inchController = uploadGui.add(spriteHeight, 'inches');

        const sizeController = uploadGui.add(sizeCategoryDropdown, 'sizeCategory', sizeCategories);

        uploadGui.add(guiFuncs, 'confirm');
        uploadGui.add(guiFuncs, 'cancel');

        const hideFeetInchesShowSize = () => {
            hideGuiElement(feetController);
            hideGuiElement(inchController);

            unHideGuiElement(sizeController);
        }

        const hideSizeShowFeetInches = () => {
            unHideGuiElement(feetController);
            unHideGuiElement(inchController);

            hideGuiElement(sizeController);
        }

        hideFeetInchesShowSize();
    }
}

const uploadCharImage = async (file: File, scaleFactor: number, heightBp : heightBp) => {
    if(file){
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'characterData');
        formData.append('scaleFactor', String(scaleFactor));
        formData.append('sizeClass', JSON.stringify(heightBp));
        formData.append('client', 'whocares');
        try{
            const response = await fetch('http://localhost:8080/addcharacter', {
                method: 'POST',
                body: formData
            });

            if(!response.ok){
                throw new Error('Network response bad');
            }

        }catch(error){
            console.error('Error sending character data to server:', error);
        }
    }
}

export const rebuildActiveSprites = (guiState : guiState, sceneObjs : sceneObjects) => {
    guiState.activeSprites.destroy();
    guiState.activeSprites = guiState.spriteDisplay.addFolder('');

    Object.values(sceneObjs.charSprites).forEach(sprite => {
        addSpriteToDisplay(guiState.activeSprites, sprite);
    })
}

const addSpriteToDisplay = (activeSprites : GUI, sprite : Sprite) => {
    const dummyObj = {
        func : () => console.log('sprite selected')
    }
    const addedSprite = activeSprites.add(dummyObj, 'func').name('');
    addGuiClass(addedSprite, 'toolkitUiElement');
    addGuiClass(addedSprite, 'activeSprite');
    setGuiImage(addedSprite, sprite.spriteUrl);
}

type controllerUnion = FunctionController<any, any> | NumberController<any, any> | OptionController<any, any>;

const addGuiClass = (controller: controllerUnion, newClass : string) => {
    const domElement = controller.domElement;
    const widget = domElement.querySelector('.widget');
    // @ts-ignore
    const guiElement = widget.firstChild;
    // @ts-ignore
    guiElement.classList.add(newClass);
}

const removeGuiClass = (controller: controllerUnion, toRemove : string) => {
    const domElement = controller.domElement;
    const widget = domElement.querySelector('.widget');
    // @ts-ignore
    const guiElement = widget.firstChild;
    // @ts-ignore
    guiElement.classList.remove(toRemove);
}

const addGuiClassNoWidget = (controller: controllerUnion, newClass : string) => {
    const domElement = controller.domElement;
    domElement.classList.add(newClass);
}

const removeGuiClassNoWidget = (controller: controllerUnion, toRemove : string) => {
    const domElement = controller.domElement;
    domElement.classList.remove(toRemove);
}

const setGuiImage = (controller: controllerUnion, image : string) => {
    const domElement = controller.domElement;
    const widget = domElement.querySelector('.widget');
    // @ts-ignore
    const guiElement = widget.firstChild;
    // @ts-ignore
    guiElement.style.backgroundImage = `url(${image})`;
}

const hideGuiElement = (controller : controllerUnion) => {
    addGuiClassNoWidget(controller, 'trueHidden');
}

const unHideGuiElement = (controller : controllerUnion) => {
    removeGuiClassNoWidget(controller, 'trueHidden');
}