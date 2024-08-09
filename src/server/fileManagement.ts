import multer from 'multer';
import fs from 'fs';
import { Request } from 'express';

// stinky workaround
import { fileURLToPath } from 'url';
import path from 'path';


const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
// stinky over

export const spriteDir = "playerSprites"
export const spritePath = path.join(__dirname, `/${spriteDir}`);

const storage : multer.StorageEngine = multer.diskStorage({
    // @ts-ignore
    destination: (req, file, cb) => {
        if (!fs.existsSync(spritePath)) {
            fs.mkdirSync(spritePath, { recursive: true });
        }else{
            fs.readdir(spritePath, (err, files) => {
                if (err) {
                    console.error(`Error reading directory ${spritePath}:`, err);
                    return;
                }
    
                //for (const file of files) {
                    //const filePath = path.join(spritePath, file);
                    //fs.unlink(filePath, (err) => {
                        //if (err) {
                            //console.error(`Error deleting file ${filePath}:`, err);
                        //} else {
                            //console.log(`Deleted file: ${filePath}`);
                        //}
                    //});
                //}
            });
        }

        cb(null, spritePath);
        console.log('remake multer');
    },

    // @ts-ignore
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        cb(null, `${Date.now()}-${safeName}`);
    }
});

    // @ts-ignore
const fileFilter: any  = (req : Request, file : Express.Multer.File, cb : any) => {
    const allowTypes = ['image/jpeg', 'image/png'];
    if(!allowTypes.includes(file.mimetype)) {
        cb(null, false);
    }else{
        cb(null, true);
    }
};

export const upload = multer({storage, fileFilter, limits: {fileSize: 5 * 1024 * 1024}});

export const getFileURL = (req: Request, filename :string) : string =>{
    const protocol = req.protocol;
    return `${req.protocol}://${req.get('host')}/${spriteDir}/${filename}`;
}