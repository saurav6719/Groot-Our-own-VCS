#!/usr/bin/env node 
// this is to make this file executable from the command line

import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { diffLines } from 'diff';
import chalk from 'chalk';
import { Command } from 'commander';

const program = new Command();

class Groot{

    constructor(repoPath = '.'){
        this.repoPath = path.join(repoPath, '.groot');
        this.objectsPath = path.join(this.repoPath, 'objects');
        this.headPath = path.join(this.repoPath, 'HEAD');
        this.indexPath = path.join(this.repoPath, 'index');
        this.init();
    }

    async init(){
        await fs.mkdir(this.objectsPath, { recursive: true });
        try {
            await fs.writeFile(this.headPath, '', {flag: 'wx'}); // wx means if the file exists, throw an error
            await fs.writeFile(this.indexPath, JSON.stringify([]), {flag: 'wx'}); 
        }
        catch(error){
            // console.log("Already initialized");
        }
    }

    hashObject(content){
        return crypto.createHash('sha1').update(content, 'utf-8').digest('hex');    
    }

    async add(fileToBeAdded){
        const fileData = await fs.readFile(fileToBeAdded, {encoding : 'utf-8'});
        const fileHash = this.hashObject(fileData);
        const newFileHashObjectPath = path.join(this.objectsPath, fileHash);
        await fs.writeFile(newFileHashObjectPath, fileData);
        await this.updateStagingArea(fileToBeAdded, fileHash);
        console.log(`Added ${fileToBeAdded}`);
    }

    async updateStagingArea(filePath, fileHash){
        const index = JSON.parse(await fs.readFile(this.indexPath, {encoding: 'utf-8'})); // reading the index file 
        index.push({path : filePath, hash: fileHash}); // adding my new file to index
        await fs.writeFile(this.indexPath, JSON.stringify(index)); // writing the updated index back
    }

    async commit(message){
        const index = JSON.parse(await fs.readFile(this.indexPath, {encoding: 'utf-8'}));
        // commit is always added after the last commit 
        // last commit is always pointed at HEAD 

        const parentCommit = await this.getCurrenthead();

        const commitData = {
            timeStamp: new Date().toISOString(), 
            message, 
            files : index,
            parent : parentCommit
        }

        // commit is also a hash 

        const commitHash = this.hashObject(JSON.stringify(commitData));
        const commitPath = path.join(this.objectsPath, commitHash);
        await fs.writeFile(commitPath, JSON.stringify(commitData));
        // now change the HEAD to new commit 
        await fs.writeFile(this.headPath, commitHash);
        // clear the staging area 
        await fs.writeFile(this.indexPath, JSON.stringify([]));

        console.log("commit successful");
    }

    async getCurrenthead(){
        try{
            return await fs.readFile(this.headPath, {encoding : 'utf-8'});
        }
        catch(error){
            return null; // first commit will not be having any head 
        }
    }

    async log(){
        let currentCommitHash = await this.getCurrenthead();
        while(currentCommitHash){
            const commitData = JSON.parse(await 
                fs.readFile(path.join(this.objectsPath, currentCommitHash), {encoding: 'utf-8'}));
                console.log('___________________________\n');
                console.log(`Commit: ${currentCommitHash}\n
                    Date: ${commitData.timeStamp}\n
                    Message: ${commitData.message}\n`);

            currentCommitHash = commitData.parent; // go to parent commit
        }
    }

    async showCommitDiff(commitHash){
        // this function will show the diff of the commit with its parent
        const commitData = JSON.parse(await this.getCommitData(commitHash));
        if(!commitData){
            console.log("Commit not found");
            return;
        }

        console.log("Changes in the last commit are :");


        for(const file of commitData.files){
            console.log(`File Name: ${file.path}`);
            const fileContent = await this.getFileContent(file.hash);
            console.log(" ------ File content started ------ \n");
            console.log(fileContent + "\n");
            console.log(" ------ File content ended ------\n");
            // now we have to see what was the file content in the parent commit

            if(commitData.parent){
                const parentCommitData = JSON.parse(await this.getCommitData(commitData.parent));
                const parentFileContent = await this.getparentFileContent(parentCommitData, file.path);

                if(parentFileContent !== undefined){
                    const diff = diffLines(parentFileContent, fileContent);

                    // console.log(diff);

                    diff.forEach(part => {
                        if(part.added){
                            process.stdout.write(chalk.green("++ " + part.value + "\n"));
                        }
                        else if(part.removed){
                            process.stdout.write(chalk.red("-- " + part.value + "\n"));
                        }
                        else{
                            process.stdout.write(chalk.yellow(part.value));
                        }
                    })

                    console.log("\n");
                }
                else{
                    console.log("This file is created in this commit, so no previous version to compare with.");
                }
            }
            else{
                console.log("This is the first commit.");
            }
        }
    }

    async getparentFileContent(parentCommitData, filePath){
        // i am checking if this filepath exist in parent commit or not 
        // if it exists in parent commit then only i can say that this file has change in this commit
        const parentFile = parentCommitData.files.find(file => file.path === filePath);

        if(parentFile){
            return await this.getFileContent(parentFile.hash);
        }
    }

    async getFileContent(fileHash){
        return await fs.readFile(path.join(this.objectsPath, fileHash), {encoding: 'utf-8'});
    }

    async getCommitData(commitHash){
        const commitPath = path.join(this.objectsPath, commitHash);
        try{
            return await fs.readFile(commitPath, {encoding: 'utf-8'});
        }
        catch(error){
            console.log("Failed to read the commit data", error);
            return null;
        }
    }

}

// (async() => {
//     const groot = new Groot();
//     // await groot.add('sample.txt');
//     // await groot.add('sample2.txt');
//     // await groot.commit("6th commit");
//     // await groot.log();
//     await groot.showCommitDiff('bfe8bc223baa55b4d8f2188f04cd130dfb0143d8');
// })();

program.command('init').action(async () => {
    const groot = new Groot();
})

program.command('add <fileName>').action(async (fileName) => {
    const groot = new Groot();
    await groot.add(fileName);
})

program.command('commit <message>').action(async (message) => {
    const groot = new Groot();
    await groot.commit(message);
});

program.command('log').action(async () => {
    const groot = new Groot();
    await groot.log();
});

program.command('show <commitHash>').action(async (commitHash) => {
    const groot = new Groot();
    await groot.showCommitDiff(commitHash);
});

program.parse(process.argv);

