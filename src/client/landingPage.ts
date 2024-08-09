//import { blobToBase64 } from './helpers.js';
//import { mapData } from '../server.js';
import '../styling/menus.css';

const markerOffset = 2;

const handleFileSelect = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (file) {
        if (validImageTypes.includes(file.type)) {
            alert("valid image selected, set map scale");

            fileInput.classList.add('hidden');
            container.classList.remove('hidden');
            const preview = document.getElementById("imgPreview") as HTMLImageElement;
            preview ? preview.src = URL.createObjectURL(file): console.log("Error: preview not found");
        } else {
            alert("invalid file, please selected an image");
            input.value = ''; // Clear the input
        }
    }
}

let scaleFactor: number;

const handleUpload = async () => {
    console.log("send file");
    // @ts-ignore
    const file = fileInput.files[0];

    if(file){
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'mapData');
        formData.append('scaleFactor', String(scaleFactor));
        try{
            console.log("sending fetch");
            const response = await fetch('http://localhost:8080/upload', {
                method: 'POST',
                body: formData
            });

            if(!response.ok){
                throw new Error('Network response bad');
            }

            const redirectUrl = response.url;

            if(redirectUrl){
                window.location.href = redirectUrl;
            }
        }catch(error){
            console.error('Error sending map data to server:', error);
        }
    }
}

let clickCount = 0;

type point = {
    x: number,
    y: number
}

let points: Array<point> = [];
let gizmos: Array<HTMLDivElement> = [];
let container: HTMLDivElement;

let lineContainer: SVGSVGElement | null;
let line: SVGLineElement | null;

const getDistanceConversion = () => {
    clickCount++;

    if(clickCount === 3){
        gizmos.forEach(gizmo => {
            gizmo.remove();
        });

        if(line) line.remove();
        line = null;
        if(lineContainer) lineContainer.remove();
        lineContainer = null;

        clickCount = 0;
        points = [];


        const fileUploader = document.getElementById("uploadFile");
        if(fileUploader) fileUploader.classList.add('softhidden');
        return;
    }

    const x = dingle.offsetLeft + markerOffset;
    const y = dingle.offsetTop + markerOffset;

    if(!lineContainer){
        lineContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        lineContainer.id = 'lineContainer';
        container.appendChild(lineContainer);

        line = document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('id','line');
        line.setAttribute('x1',`${x}`);
        line.setAttribute('y1',`${y}`);
        line.setAttribute('x2',`${x}`);
        line.setAttribute('y2',`${y}`);
        line.setAttribute("stroke", "red")
        lineContainer.appendChild(line);
    }else{
        if(line){
            line.setAttribute('x2',`${x}`);
            line.setAttribute('y2',`${y}`);
        }
    }
    
    points.push({ x, y });

    const gizmo = document.createElement('div');
    gizmo.classList.add('marker');

    gizmo.style.left = `${x - markerOffset}px`;
    gizmo.style.top = `${y - markerOffset}px`; 

    container.appendChild(gizmo);
    gizmos.push(gizmo);
    
    if (clickCount === 2) {
        const distance = Math.sqrt(Math.pow(points[1].x - points[0].x, 2) + Math.pow(points[1].y - points[0].y, 2));
        const fileUploader = document.getElementById("uploadFile");
        if(fileUploader) fileUploader.classList.remove('softhidden');
        scaleFactor = distance;
    }
}

let dingle : HTMLDivElement;

const manageDingle = (event: MouseEvent) => {
    const rect = container.getBoundingClientRect();

    let x = parseFloat(String(event.clientX - rect.left));
    let y = parseFloat(String(event.clientY - rect.top));

    if(points.length === 1){
        const ogPoint = points[0];
        if(Math.abs(y - ogPoint.y) < 5){
            y = ogPoint.y;
        }else if (Math.abs(x - ogPoint.x) < 5){
            x = ogPoint.x;
        }
        if(line){
            line.setAttribute('x2',`${x}`);
            line.setAttribute('y2',`${y}`);
        }
    }

    dingle.style.left = `${x - markerOffset}px`;
    dingle.style.top = `${y - markerOffset}px`; 
}

let fileUploader: HTMLButtonElement;
let fileInput: HTMLInputElement;
let preview: HTMLImageElement;

document.addEventListener('DOMContentLoaded', () => {
    fileUploader = document.getElementById('uploadFile') as HTMLButtonElement;
    fileInput = document.getElementById('fileInput') as HTMLInputElement;
    preview = document.getElementById('imgPreview') as HTMLImageElement;

    fileUploader.addEventListener('click', handleUpload);
    fileInput.addEventListener('change', handleFileSelect);
    preview.addEventListener('click', getDistanceConversion);

    // @ts-ignore
    container = document.getElementById('imgContainer');

    // @ts-ignore
    dingle = document.getElementById('dingle');

    // @ts-ignore
    document.getElementById('imgContainer').addEventListener('mousemove', manageDingle);
});