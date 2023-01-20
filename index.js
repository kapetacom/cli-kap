#!/usr/bin/env node
const {program} = require('commander');
const packageData = require('./package.json');
const Commands = require('./src/commands');
const {BlockwareAPI} = require('@blockware/nodejs-api-client');

function handleError(err) {
    if (err.error) {
        console.error('Command failed: %s', err.error);
    } else {
        console.error('Unexpected issue: ', err)
    }
}

function makeCommand(callback) {

    return async function() {
        try {
            await callback(...arguments)
        } catch (err) {
            handleError(err);
        }
    }
}

program.name('blockctl')
    .version(packageData.version);

program
    .command('uninstall <command-name>')
        .alias('rm')
        .description('Will remove the command specified from the list of available command')
        .action(makeCommand((commandName) => {
            Commands.uninstall(commandName)
            process.exit(0);
        }));

program
    .command('link [command-name]')
    .description('Links current working directory as a command. If no command name is specified it will use the "command" property from package.json')
    .alias('ln')
    .action(makeCommand((commandName) => {
        Commands.link(commandName);
        process.exit(0);
    }));


program
    .command('install <package-name> [command-name]')
    .alias('i')
    .description('Will install the NPM package as a command. Must be a valid blockctl-command implementation.')
    .action(makeCommand((packageName, commandName) => {
        if (!commandName) {
            //Defaults to blockware package
            commandName = packageName;
            packageName = '@blockware/blockctl-command-' + commandName.toLowerCase();
        }

        Commands.ensure(packageName, commandName);
        process.exit(0);
    }));

program
    .command('upgrade <command-name>')
    .description('Upgrades an existing command by installing the latest from the NPM registry.')
    .action(makeCommand((commandName) => {
        Commands.upgrade(commandName);
        process.exit(0);
    }));

program
    .command('login')
    .description('Authenticates against Blockware Cloud.')
    .action(makeCommand(async () => {
        await Commands.login();
        process.exit(0);
    }));

program
    .command('logout')
    .description('Removes any current authentication for Blockware Cloud.')
    .action(makeCommand(async () => {
        await Commands.logout();
        process.exit(0);
    }));

program
    .command('organizations')
    .description('Lists all available organizations.')
    .action(makeCommand(async () => {
        await Commands.listIdentities();
        process.exit(0);
    }));

program
    .command('whoami')
    .description('Get current identity and organization.')
    .action(makeCommand(async () => {
        await Commands.showCurrentIdentity();
        process.exit(0);
    }));

program
    .command('use [handle]')
    .description('Change to organization.')
    .action(makeCommand(async (handle) => {
        await Commands.useOrganization(handle);
        process.exit(0);
    }));

program
    .command('init-defaults')
    .description('Installs default commands.')
    .action(makeCommand(() => {
        console.log('Ensuring default commands...');
        Commands.ensureCommands();
        process.exit(0);
    }));

(async function() {
    const api = new BlockwareAPI();
    if (api.hasToken()) {
        try {
            //Make sure our access token is up to date
            await api.ensureAccessToken();
        } catch (e) {
            console.warn('Failed to refresh access token: ', e);
        }

        //We pass the path to the authentication file down to the sub commands
        process.env.BLOCKWARE_CREDENTIALS = api.getTokenPath();

        //We also pass the used blockctl down
        process.env.BLOCKWARE_BLOCKCTL_PATH = process.argv[0];
    }

    const commands = Commands.getCommands();

    if (commands.length > 0) {
        commands.forEach((commandId) => {
            try {
                const commandInfo = Commands.getCommandInfo(commandId);
                program.command(
                    commandInfo.command,
                    commandInfo.description,
                    { executableFile: commandInfo.executable }
                );
            } catch(e) {
                console.error('Failed to load command: %s', commandId, e.stack);
            }
        });
    }

    if (process.argv.length < 3) {

    console.log(`
    
      ____  _            _                            
     | __ )| | ___   ___| | ____      ____ _ _ __ ___ 
     |  _ \\| |/ _ \\ / __| |/ /\\ \\ /\\ / / _\` | '__/ _ \\
     | |_) | | (_) | (__|   <  \\ V  V / (_| | | |  __/
     |____/|_|\\___/ \\___|_|\\_\\  \\_/\\_/ \\__,_|_|  \\___|
    
                                                      
    `);
        program.help();
        process.exit(1);
    }

    program.parse(process.argv);
}());
