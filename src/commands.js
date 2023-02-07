const FS = require('fs');
const mkdirp = require("mkdirp");
const Path = require('path');
const inquirer = require('inquirer');
const open = require('open');
const NPM = require('@blockware/npm-package-handler');
const {BlockwareAPI} = require('@blockware/nodejs-api-client');
const Paths = require('./paths');

function getCommandPath(commandName) {
    return Path.join(Paths.BASEDIR_COMMANDS, commandName);
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
        if (!FS.existsSync(Paths.BASEDIR_COMMANDS)) {
            mkdirp.sync(Paths.BASEDIR_COMMANDS);
        }

        if (!FS.existsSync(Paths.BASEDIR_COMMANDS)) {
            mkdirp.sync(Paths.BASEDIR_COMMANDS);
        }

        if (!FS.existsSync(Paths.BASEDIR_USER)) {
            mkdirp.sync(Paths.BASEDIR_USER);
        }
    }

    _writeUserCommands() {
        FS.writeFileSync(Paths.USER_COMMANDS, JSON.stringify(this._commands, null, 2));
    }

    ensureCommands() {
        console.log('Ensuring %s default commands...', Paths.ALL_COMMANDS.length);
        for(let i = 0; i < Paths.ALL_COMMANDS.length; i++) {
            const path = Paths.ALL_COMMANDS[i];

            if (!FS.existsSync(path)) {
                console.log('Skipping commands because it does not exist: ', path);
                continue;
            }

            this._commands = readJSON(path);

            if (Object.keys(this._commands).length < 1) {
                console.log('Skipping commands because it was empty: ', path);
                //Empty
                continue;
            }

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
        if (!FS.existsSync(Paths.BASEDIR_COMMANDS)) {
            return []
        }
        return FS.readdirSync(Paths.BASEDIR_COMMANDS)
    }
    
    getCommandInfo(commandName) {
        const basePath = Path.join(Paths.BASEDIR_COMMANDS, commandName);
        const commandInfo = require(Path.join(basePath, 'package.json'));

        if (!commandInfo.main) {
            commandInfo.main = 'index.js';
        }

        commandInfo.executable = Path.join(basePath,'index.js');

        if (!commandInfo.command) {
            commandInfo.command = commandName;
        }
        
        if (!commandInfo.description) {
            commandInfo.description = 'No description';
        }
        
        return commandInfo;
    }

    async login() {
        const me = this;
        const questions = [];

        questions.push({
            type: 'input',
            name: 'service',
            message: 'The url to the blockware service you want to authenticate against',
            default: new BlockwareAPI().getBaseUrl()
        });

        questions.push({
            type: 'input',
            name: 'client_id',
            message: 'The OAuth Client ID to authenticate using. Leave as default for most use cases.',
            default: new BlockwareAPI().getClientId()
        });

        const answers = await inquirer.prompt(questions);

        const api = new BlockwareAPI({
            base_url: answers.service,
            client_id: answers.client_id
        });

        await api.doDeviceAuthentication({
            onVerificationCode: (verification_uri_complete) => {
                console.log('Open the following url in your browser to complete verification: ');
                console.log('\t' + verification_uri_complete);
                console.log('');

                open(verification_uri_complete);
            }
        })
        console.log('Authenticated successfully!');

        await me.showCurrentIdentity();
    }

    async listIdentities() {
        const api = new BlockwareAPI();
        const memberships = await api.getCurrentMemberships();
        const context = await api.getCurrentContext()

        console.log('\n------------------------------------------------');
        memberships.forEach(membership => {
            const isCurrent = !!(context && context.identity.id === membership.identity.id);
            if (isCurrent) {
                console.log('* %s [%s] (Current context)', membership.identity.handle, membership.identity.name);
            } else {
                console.log('- %s [%s]', membership.identity.handle, membership.identity.name);
            }
        });

        console.log('------------------------------------------------\n\n');
    }

    async showCurrentIdentity() {

        const api = new BlockwareAPI();

        const identity = await api.getCurrentIdentity()
        const context = await api.getCurrentContext()

        if (!identity) {
            console.error('Could not find identity [%s]', api.getUserInfo()?.sub);
            return;
        }
        console.log('\n------------------------------------------------');
        console.log('Name: %s', identity.name);
        console.log('Type: %s', identity.type);
        console.log('Handle: %s', identity.handle || 'none');
        if (context) {
            console.log('Organization: %s [%s]', context.identity.name, context.identity.handle);
        } else {
            console.log('Organization: none');
        }
        console.log('------------------------------------------------\n\n');
    }

    async useOrganization(handle) {
        const api = new BlockwareAPI();
        if (handle) {
            const membership = await api.switchContextTo(handle);
            console.log('Switched context to organization: %s', membership.identity.name);
        } else {
            await api.removeContext();
            console.log('Switched context to user');
        }
    }



    async logout() {
        const api = new BlockwareAPI();
        if (api.removeToken()) {
            console.log('Logged out');
        }
    }

}

module.exports = new Commands();