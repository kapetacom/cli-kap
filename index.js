#!/usr/bin/env node
const program = require('./src/commander');
const packageData = require('./package.json');
const Commands = require('./src/commands');

program.name('blockctl')
    .version(packageData.version);

program
    .command('uninstall <command-name>')
        .alias('rm')
        .description('Will remove the command specified from the list of available command')
        .action((commandName) => {
            Commands.uninstall(commandName)
            process.exit(0);
        });

program
    .command('link [command-name]')
    .description('Links current working directory as a command. If no command name is specified it will use the "command" property from package.json')
    .alias('ln')
    .action((commandName) => {
        Commands.link(commandName);
        process.exit(0);
    });


program
    .command('install <package-name> [command-name]')
    .alias('i')
    .description('Will install the NPM package as a command. Must be a valid blockctl-command implementation.')
    .action((packageName, commandName) => {
        if (!commandName) {
            //Defaults to blockware package
            commandName = packageName;
            packageName = '@blockware/blockctl-command-' + commandName.toLowerCase();
        }

        Commands.ensure(packageName, commandName);
        process.exit(0);
    });

program
    .command('upgrade <command-name>')
    .description('Upgrades an existing command by installing the latest from the NPM registry.')
    .action((commandName) => {
        Commands.upgrade(commandName);
        process.exit(0);
    });

program
    .command('login [username]')
    .description('Authenticates against Blockware Cloud.')
    .action(async (username) => {
        await Commands.login(username);
        process.exit(0);
    });

program
    .command('logout')
    .description('Removes any current authentication for Blockware Cloud.')
    .action(async () => {
        await Commands.logout();
        process.exit(0);
    });

program
    .command('identity-list')
    .description('Lists all available identities.')
    .action(async () => {
        await Commands.listIdentities();
        process.exit(0);
    });

program
    .command('whoami')
    .description('Get current identity.')
    .action(async () => {
        await Commands.showCurrentIdentity();
        process.exit(0);
    });

program
    .command('use [identity]')
    .description('Change to identity.')
    .action(async (username) => {
        await Commands.setCurrentIdentity(username);
        process.exit(0);
    });

program
    .command('init-defaults')
    .description('Installs default commands.')
    .action(() => {
        console.log('Ensuring default commands...');
        Commands.ensureCommands();
        process.exit(0);
    });

const commands = Commands.getCommands();

if (commands.length > 0) {
    commands.forEach((commandId) => {
        try {
            const commandInfo = Commands.getCommandInfo(commandId);
            program.command(commandInfo.command, commandInfo.description);
        } catch(e) {
            console.error('Failed to load command: %s', commandId, e.stack);
        }
    });
}


console.log(`

  ____  _            _                            
 | __ )| | ___   ___| | ____      ____ _ _ __ ___ 
 |  _ \\| |/ _ \\ / __| |/ /\\ \\ /\\ / / _\` | '__/ _ \\
 | |_) | | (_) | (__|   <  \\ V  V / (_| | | |  __/
 |____/|_|\\___/ \\___|_|\\_\\  \\_/\\_/ \\__,_|_|  \\___|

                                                  
`);

if (process.argv.length < 3) {
    console.error('No command specified\n');
    program.help();
    process.exit(1);
}

program.parse(process.argv);
