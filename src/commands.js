const FS = require('fs');
const mkdirp = require("mkdirp");
const Path = require('path');
const NPM = require('@blockware/npm-package-handler');
const ClusterConfiguration = require('@blockware/local-cluster-config');

const BASEDIR_BLOCKWARE = ClusterConfiguration.getBlockwareBasedir();
const BASEDIR_USER = Path.join(BASEDIR_BLOCKWARE, 'blockctl');
const USER_COMMANDS = BASEDIR_USER + '/commands.json';

const BASEDIR_COMMANDS = Path.join(__dirname, '../commands');
const DEFAULT_COMMANDS = Path.normalize(__dirname + '/../default-commands.json');

const PATHS = [
    USER_COMMANDS,
    DEFAULT_COMMANDS
];

function getCommandPath(commandName) {
    return Path.join(BASEDIR_COMMANDS, commandName);
}

function getPackageJSON(commandName) {
    const path = getCommandPath(commandName) + '/package.json';
    return readJSON(path);
}

function readJSON(filename) {
    return JSON.parse(FS.readFileSync(filename).toString())
}

class Commands {
    constructor() {
        this._ensureBaseDirs();
        this._commands = {};
    }
    
    _ensureBaseDirs() {
        if (!FS.existsSync(BASEDIR_COMMANDS)) {
            mkdirp.sync(BASEDIR_COMMANDS);
        }

        if (!FS.existsSync(BASEDIR_COMMANDS)) {
            mkdirp.sync(BASEDIR_COMMANDS);
        }

        if (!FS.existsSync(BASEDIR_USER)) {
            mkdirp.sync(BASEDIR_USER);
        }
    }

    _writeUserCommands() {
        FS.writeFileSync(USER_COMMANDS, JSON.stringify(this._commands, null, 2));
    }

    ensureCommands() {
        for(var i = 0; i < PATHS.length; i++) {
            const path = PATHS[i];
            if (!FS.existsSync(path)) {
                continue;
            }

            this._commands = readJSON(path);

            for(const commandName in this._commands) {
                if (this._commands.hasOwnProperty(commandName)) {
                    const packageName = this._commands[commandName];
                    this.ensure(packageName, commandName, true);
                }
            }

            break;
        }

        this._writeUserCommands();
    }

    install(packageName, commandName) {
        if (this.exists(commandName)) {
            throw new Error('Command already exists: ' + commandName);
        }

        const path = getCommandPath(commandName);

        console.log('Installing command %s in %s', commandName, path);

        const npm = new NPM(path);

        npm.install(packageName);

        this._commands[commandName] = packageName;
        this._writeUserCommands();

        console.log('-- Installed command %s in %s', commandName, path);
    }

    uninstall(commandName) {
        if (!this.exists(commandName)) {
            return;
        }

        const path = getCommandPath(commandName);

        const npm = new NPM(path);

        npm.remove();

        console.log('Removing command %s from %s', commandName, path);

        delete this._commands[commandName];
        this._writeUserCommands();

        console.log('-- Removed command %s from %s', commandName, path);
    }

    upgrade(commandName) {
        if (!this.exists(commandName)) {
            console.error('Command not found: ' + commandName);
            return;
        }

        const packageJson = getPackageJSON(commandName);
        const path = getCommandPath(commandName);

        console.log('Upgrading command %s for %s', commandName, packageJson.name);

        const npm = new NPM(path);
        npm.upgrade(packageJson.name);

        console.log('-- Upgraded command %s from %s', commandName, packageJson.name);
    }

    link(commandName) {
        const packageJson = Path.join(process.cwd(), 'package.json');

        if (!FS.existsSync(packageJson)) {
            console.error('No NPM module found in current directory');
            return;
        }

        if (!commandName) {
            const packageInfo = readJSON(packageJson);
            if (!packageInfo.command) {
                console.error('package.json is missing "command" property and no command name was specified.');
                return;
            }

            commandName = packageInfo.command;
        }

        console.log('Linking command %s to current working dir', commandName);

        const path = getCommandPath(commandName);
        const npm = new NPM(path);

        npm.link(process.cwd());
    }

    ensure(packageName, commandName, silent) {
        if (this.exists(commandName)) {
            if (!silent) {
                console.log('Command already exists: %s', commandName);
            }
            return;
        }

        this.install(packageName, commandName);
    }

    exists(commandName) {
        const path = getCommandPath(commandName);
        return FS.existsSync(path);
    }
    
    getCommands() {
        return FS.readdirSync(BASEDIR_COMMANDS)
    }
    
    getCommandInfo(commandName) {
        const commandInfo = require(Path.join(BASEDIR_COMMANDS, commandName, 'package.json'));

        if (!commandInfo.command) {
            commandInfo.command = commandName;
        }
        
        if (!commandInfo.description) {
            commandInfo.description = 'No description';
        }
        
        return commandInfo;
    }
}

module.exports = new Commands();