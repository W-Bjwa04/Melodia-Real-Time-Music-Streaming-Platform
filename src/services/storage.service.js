import ImageKit from '@imagekit/nodejs';
import fs from 'fs';

let client = null;

const getClient = () => {
    if (!client) {
        if (!process.env.IMAGEKIT_PRIVATE_KEY) {
            throw new Error('IMAGEKIT_PRIVATE_KEY is not set in environment variables');
        }
        client = new ImageKit({
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        });
    }
    return client;
};



const uploadFile = async (path, fileName) => {
    try {
        const params = {
            file: fs.createReadStream(path),
            fileName: fileName,
        };
        const response = await getClient().files.upload(params);
        return response;
    } catch (error) {
        console.error("Error uploading file to ImageKit:", error);
        throw error;
    }
}


export default { uploadFile}