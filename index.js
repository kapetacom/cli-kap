#!/usr/bin/env node
const program = require('./src/commander');
const packageData = require('./package.json');
const FS = require('fs');

const COMMANDS_BASEDIR = __dirname + '/commands';

program.name(packageData.name)
    .version(packageData.version);


const commands = FS.readdirSync(COMMANDS_BASEDIR);

if (commands.length > 0) {
    commands.forEach((commandId) => {
        try {

            const moduleInfo = require('./commands/' + commandId + '/package.json');

            if (!moduleInfo.command) {
                moduleInfo.command = commandId;
            }

            program.command(moduleInfo.command, moduleInfo.description || 'No description');
        } catch(e) {
            console.error('Failed to load command: %s', commandId, e.stack);
        }
    });

}

if (process.argv.length < 3) {
    console.error('No command specified\n');
    program.help();
    process.exit(1);
}


program.parse(process.argv);
