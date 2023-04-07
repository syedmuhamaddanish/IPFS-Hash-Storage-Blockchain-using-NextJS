import {Web3Storage, getFilesFromPath } from 'web3.storage';
const {ethers} = require('ethers');
import * as Constants from "../constant";
import formidable from 'formidable';
import path from 'path';

export const config = {
    api: {
        bodyParser: false    // disable built-in body parser
    }
}

function moveFiletoServer(req) {
    return new Promise((resolve, reject) => {
        const options = {};
        options.uploadDir = path.join(process.cwd(), "/pages/uploads");
        options.filename = (name, ext, path, form) => {
            return path.originalFilename;
        }
        const form = formidable(options);

        form.parse(req, (err, fields, files) => {
            if (err) {
                console.error(err);
                reject("Something went wrong");
                return;
            }
            const uniqueFileName = fields.filename;
            const actualFileName = files.file.originalFilename;

            resolve({uniqueFileName, actualFileName});
        })
    })
}


async function storeDataInBlockchain(actualFileName, uniqueFileName) {
    const provider = new ethers.providers.JsonRpcProvider(Constants.API_URL);
    const signer = new ethers.Wallet(Constants.PRIVATE_KEY, provider);
    const StorageContract = new ethers.Contract(Constants.contractAddress, Constants.contractAbi, signer);

    const isStored = await StorageContract.isFileStored(uniqueFileName);

    console.log(isStored);

    if (isStored == false) {
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDU5Y2VmRmY4RDg2MkEzQUY3OTIzMzhkNjNmOEEwZjQ0MzAwMTQwN2YiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2ODA4OTE1NDY3NTQsIm5hbWUiOiJpcGZzLWJsb2NrY2hhaW4ifQ.bSwyKqF5Htm2uIgp3tvdRlpamXx8R42aP6SWy96-DZc";
        const storage = new Web3Storage({token: token});
        const uploadPath = path.join(process.cwd(), "/pages/uploads");
        const files = await getFilesFromPath(uploadPath, `/${actualFileName}`);
        const cid = await storage.put(files);
        let hash = cid.toString();
        console.log("Storing the data in IPFS");
        const tx = await StorageContract.upload(uniqueFileName, hash);
        await tx.wait();
        const storedhash = await StorageContract.getIPFSHash(uniqueFileName);
        return {message: `IPFS hash is stored in the smart contract: ${storedhash}`}
    }

    else {
        console.log("Data is already stored for this file name");
        const IPFShash = await StorageContract.getIPFSHash(uniqueFileName);
        return {message: `IPFS hash is already stored in the smart contract: ${IPFShash}`}
    }
}
// we are moving files from local pc to this server directoy
// we are going to store file in IPFS
// we are going to store IPFS hash in blockchain
async function handler(req, res) {
    try {
        const {uniqueFileName, actualFileName} = await moveFiletoServer(req)
        console.log("Files are stored in local server");

        await new Promise(resolve => setTimeout(resolve, 2000));  //waiting for 2 seconds

        const resposne = await storeDataInBlockchain(actualFileName, uniqueFileName)
        console.log("Hash stored in smart contract");

        return res.status(200).json(resposne);
    }
    catch (err) {
        console.error(err);
    }
}

export default handler;