const commander = require('commander');
const Command = commander.Command;
const spawn = require('child_process').spawn;
const path = require('path');
const dirname = path.dirname;
const basename = path.basename;
const fs = require('fs');


Command.prototype.executeSubCommand = function(argv, args, unknown) {
    args = args.concat(unknown);

    if (!args.length) this.help();
    if (args[0] === 'help' && args.length === 1) this.help();

    // <cmd> --help
    if (args[0] === 'help') {
        args[0] = args[1];
        args[1] = '--help';
    }

    // executable
    var f = argv[1];
    // name of the subcommand, link `pm-install`
    var bin = 'commands/' + args[0] + '/index';

    // In case of globally installed, get the base dir where executable
    //  subcommand file should be located at
    var baseDir;

    var resolvedLink = fs.realpathSync(f);

    baseDir = dirname(resolvedLink) + '/../';

    // prefer local `./<bin>` to bin in the $PATH
    var localBin = path.join(baseDir, bin);

    // whether bin file is a js script with explicit `.js` or `.ts` extension
    var isExplicitJS = false;
    if (exists(localBin + '.js')) {
        bin = localBin + '.js';
        isExplicitJS = true;
    } else if (exists(localBin + '.ts')) {
        bin = localBin + '.ts';
        isExplicitJS = true;
    } else if (exists(localBin + '.mjs')) {
        bin = localBin + '.mjs';
        isExplicitJS = true;
    } else if (exists(localBin)) {
        bin = localBin;
    }

    args = args.slice(1);

    var env = Object.assign({}, process.env);

    env.BLOCKWARE_PARENT_CLI = this.name();

    var proc;
    if (process.platform !== 'win32') {
        if (isExplicitJS) {
            args.unshift(bin);
            // add executable arguments to spawn
            args = (process.execArgv || []).concat(args);

            proc = spawn(process.argv[0], args, { stdio: 'inherit', customFds: [0, 1, 2], env });
        } else {
            proc = spawn(bin, args, { stdio: 'inherit', customFds: [0, 1, 2], env });
        }
    } else {
        args.unshift(bin);
        proc = spawn(process.execPath, args, { stdio: 'inherit', env });
    }

    var signals = ['SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGINT', 'SIGHUP'];
    signals.forEach(function(signal) {
        process.on(signal, function() {
            if (proc.killed === false && proc.exitCode === null) {
                proc.kill(signal);
            }
        });
    });
    proc.on('close', process.exit.bind(process));
    proc.on('error', function(err) {
        if (err.code === 'ENOENT') {
            console.error('error: %s(1) does not exist, try --help', bin);
        } else if (err.code === 'EACCES') {
            console.error('error: %s(1) not executable. try chmod or run with root', bin);
        }
        process.exit(1);
    });

    // Store the reference to the child process
    this.runningCommand = proc;
};

function exists(file) {
    try {
        if (fs.statSync(file).isFile()) {
            return true;
        }
    } catch (e) {
        return false;
    }
}

module.exports = commander;