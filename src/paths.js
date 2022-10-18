const ClusterConfiguration = require("@blockware/local-cluster-config");
const Path = require("path");
const BASEDIR_BLOCKWARE = ClusterConfiguration.getBlockwareBasedir();
const BASEDIR_USER = Path.join(BASEDIR_BLOCKWARE, 'blockctl');

const USER_COMMANDS = BASEDIR_USER + '/commands.json';
const AUTH_TOKEN = BASEDIR_USER + '/authentication.json';

const BASEDIR_COMMANDS = Path.join(__dirname, '../commands');
const DEFAULT_COMMANDS = Path.normalize(__dirname + '/../default-commands.json');

const ALL_COMMANDS = [
    USER_COMMANDS,
    DEFAULT_COMMANDS
];

module.exports = {
    BASEDIR_BLOCKWARE,
    BASEDIR_USER,
    USER_COMMANDS,
    AUTH_TOKEN,
    BASEDIR_COMMANDS,
    DEFAULT_COMMANDS,
    ALL_COMMANDS
};