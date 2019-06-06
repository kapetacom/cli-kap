const {exec} = require('child_process');
const OS = require('os');
const FS = require('fs');

class CommandInstaller {

    constructor(packageName, target) {
        this._packageName = packageName;
        this._target = target;
    }

    _npmInstall() {
        const tmpFolder = OS.tmpdir() + '/blockctl/commands/' + this._packageName;
        exec('npm i ' + this._packageName + ' --prefix ' + tmpFolder.replace(/@/g,'\\@'));

        FS.renameSync(tmpFolder + '/node_modules/' + this._packageName, this._target);
        FS.renameSync(tmpFolder + '/node_modules', this._target + '/node_modules');

    }

    process() {

        this._npmInstall();
    }
}

module.exports = CommandInstaller;