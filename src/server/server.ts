import WebSocket, { WebSocketServer } from 'ws';
import express, {Request, Response} from 'express';
import path from 'path';
import http from 'http';
import bodyParser from 'body-parser';

import { upload, spritePath, __dirname, spriteDir, getFileURL} from './fileManagement.js';
import { Mutex } from './mutex.js';

import { jankVector3, mapData, message, newSprite, spriteMove } from '../shared/messages.js';
import { heightBp } from 'src/shared/heightBreakpoints.js';

type storeMap = {
    scaleFactor: number,
    path: string,
    url: string
}

type storeSprite = {
    id : string,
    scaleFactor: number,
    owner: string,
    path: string,
    fileUrl: string,
    sizeClass: heightBp,
    currPos: jankVector3
}

const jankVector3Zero : jankVector3 = {x:0, y:0, z:0};

let sprites: {[key: string] : storeSprite} = {};

const app = express();
const expressServer = http.createServer(app);

app.use(`/${spriteDir}`, express.static(spritePath));

const addSpriteMutex = new Mutex();

app.get('/', (_ : Request, res: Response) => {
    console.log("working");
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

let parsedMapData: storeMap;

app.post('/upload', upload.single('file'), (req: Request, res: Response) => {
    console.log('trying upload');
    try {
        if(req.file){
            const filePath = path.join(spritePath, req.file.filename);
            const { type, scaleFactor } = req.body;

            if(type != 'mapData'){
                res.status(500).json({ error: 'bad message type' });
                return;
            }

            const url = getFileURL(req, req.file.filename);

            parsedMapData = {scaleFactor: scaleFactor, path: filePath, url: url};

            res.redirect(302, '/map');
        }
    } catch (error) {
        console.error('Error processing upload:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/addcharacter', upload.single('file'), (req: Request, res: Response) => {
    console.log('charactter post requested');
    try {
        if(req.file){
            const filePath = path.join(spritePath, req.file.filename);
            const {type, scaleFactor, client, sizeClass} = req.body;

            let parsedSizeClass : heightBp = JSON.parse(sizeClass) as heightBp;

            const url = getFileURL(req, req.file.filename);

            if(type != 'characterData'){
                res.status(500).json({ error: 'bad message type' });
                return;
            }

            res.status(200).json({ message: 'Success'});

            finishAddSprite(filePath, scaleFactor, client, url, parsedSizeClass);
        }
    } catch ( error ) {
        console.error('Error processing sprite upload:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

let numSprites = 0; // accessed exclusivly thru mutex -> syncronized
const finishAddSprite = async (path: string, scaleFactor: number, owner: string, url: string, sizeClass : heightBp) => { // async func add character to local dict then sends all clients sprite info
    const release = await addSpriteMutex.acquire();
    let mutexId: string | null = null;

    console.log("message data parsed, image loaded; finalize");
    try {
        mutexId = String(numSprites++);
    } finally {
        release();
        if(mutexId){

            console.log("mutex released + no fail, store sprite");
            const newSprite: storeSprite = {
                path: path,
                fileUrl: url,
                scaleFactor: scaleFactor,
                owner: owner,
                id: mutexId,
                sizeClass: sizeClass,
                currPos: jankVector3Zero
            }

            //const spriteObj = new sprite(mutexId);
            //sprites[mutexId] = {stored: newSprite, object: spriteObj};
            sprites[mutexId] = newSprite;
            sendInitialSprite(mutexId);
        }
    } 
}

const sendInitialSprite = (getId:string) => {
    console.log("sending sprite to clients");
    const initial : newSprite = getSpriteInitial(getId);
    messageAll(initial);
}

const getSpriteInitial = (getId: string) : newSprite =>{
    const spritePair = sprites[getId];
    const initialize : newSprite = {
        type: 'newSprite',
        id: getId,
        //imgUrl: spritePair.stored.fileUrl
        imgUrl: spritePair.fileUrl,
        scaleFactor: spritePair.scaleFactor,
        sizeClass: spritePair.sizeClass,
        position: spritePair.currPos
    }

    return initialize;
}

app.get('/map', (_ : Request, res : Response) => {
    res.sendFile(path.join(__dirname, '../client/map.html'));
})

app.get('/mapData', (_ : Request, res : Response) => {
    const data: mapData = {type: 'mapData', scaleFactor: parsedMapData.scaleFactor, imgUrl: parsedMapData.url}
    res.json(data);
})

app.get('/spriteData', (_ : Request, res : Response) => {
    const data: newSprite[] = []; 
    Object.keys(sprites).forEach(key => {
        data.push(getSpriteInitial(key));
    });
    res.json(data);
})

app.use(express.static(path.join(__dirname, '../../dist/client')));
app.use(bodyParser.json( {limit:'50mb'} ));

const server = new WebSocketServer({ server : expressServer });

server.on('connection', (socket: WebSocket) => {
    playerConnect(socket);
    console.log("wanna send map data");
    if(parsedMapData){
        console.log("sending map data");
        socket.send(JSON.stringify(parsedMapData));
    }
});

const playerConnect = (socket: WebSocket) => {
    console.log("connection");
    socket.on('message', (message: string) => {
        const parsed: message = JSON.parse(message)
        console.log('Received:', parsed);
        if(parsed.type == 'spriteMove'){
            logSpriteMovement(parsed);
            simpleRelay(parsed, socket);
        }
    });

    socket.on('close', () => {
        console.log('player disconnected');
    });

    socket.on('error', (error) => {
        console.error('WebSocket error in player connection:', error);
    });
}

const logSpriteMovement = (message : spriteMove) => {
    sprites[message.id].currPos = message.newPos;
}

const simpleRelay = (json: message, sender: WebSocket) => {
    const stringMessage = JSON.stringify(json);
    server.clients.forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(stringMessage);
        }
    });
}

const messageAll = (json: message) => {
    const stringMessage = JSON.stringify(json);
    server.clients.forEach((client) => {
        client.send(stringMessage);
    });
}

const PORT = 8080;
expressServer.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
    console.log(`Serving static files from: ${spritePath}`);
});