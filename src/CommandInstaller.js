const {spawnSync} = require('child_process');
const OS = require('os');
const FS = require('fs');
const rimraf = require("rimraf");

class CommandInstaller {

    constructor(packageName, target) {
        this._packageName = packageName;
        this._target = target;
    }

    _npmInstall() {
        const tmpFolder = OS.tmpdir() + '/blockctl/commands/' + this._packageName;
        if (FS.existsSync(tmpFolder)) {
            rimraf.sync(tmpFolder)
        }

        //Install using npm
        spawnSync('npm i ' + this._packageName + ' --prefix ' + tmpFolder.replace(/@/g,'\\@'), {
            stdio: 'inherit',
            shell: true
        });

        //Move into place
        FS.renameSync(tmpFolder + '/node_modules/' + this._packageName, this._target);
        FS.renameSync(tmpFolder + '/node_modules', this._target + '/node_modules');

        //Clean up
        rimraf.sync(tmpFolder);
    }

    process() {

        this._npmInstall();
    }
}

module.exports = CommandInstaller;