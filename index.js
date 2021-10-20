import dotenv  from 'dotenv'
import fs from 'fs'
import { ModelManager } from '@glazed/devtools'
import { model } from './token-list/dist/model.cjs'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { DIDDataStore } from '@glazed/did-datastore'
import { DID } from 'dids'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import { getResolver } from 'key-did-resolver'
import { fromString } from 'uint8arrays'
import TokenList from './tokenlist.json'

dotenv.config()

function getTime(){
    const timeElapsed = Date.now();
    const today = new Date(timeElapsed);
    return today.toDateString(); 
}

const noteUrl = 'https://ceramic-clay.3boxlabs.com'
async function main(){
    const key = fromString(process.env.SEED, 'base16')
    const did = new DID({
        provider: new Ed25519Provider(key),
        resolver: getResolver(),
    })
    await did.authenticate()
    const ceramic = new CeramicClient(noteUrl)
    ceramic.did = did
    const manager = new ModelManager(ceramic)
    manager.addJSONModel(model)
    const published = await manager.toPublished()
    const dataStore = new DIDDataStore({ ceramic, model: published })
    const save = await dataStore.set(manager.definitions, TokenList)
    const idPath =  save.toUrl().split('//')[1]
    const text = `\n ${getTime()},ceramic://${idPath},${noteUrl}/api/v0/streams/${idPath}`
    fs.appendFile('savedLists.csv', text, function (err) {
        if (err) throw err;
        console.log('Saved!');
      }); 
}
main()