const ClusterConfiguration = require("@blockware/local-cluster-config");
const Path = require("path");
const BASEDIR_BLOCKWARE = ClusterConfiguration.getBlockwareBasedir();

const BASEDIR_USER = Path.join(BASEDIR_BLOCKWARE, 'blockctl');
const USER_COMMANDS = Path.join(BASEDIR_USER , 'commands.json');
const BASEDIR_COMMANDS = Path.join(BASEDIR_USER, 'commands');

const DEFAULT_COMMANDS = Path.normalize(Path.join(__dirname , '/../default-commands.json'));
const CI_COMMANDS = Path.normalize(Path.join(__dirname , '/../ci-commands.json'));

const ALL_COMMANDS = [
    USER_COMMANDS,
    process.env.CI ? CI_COMMANDS : DEFAULT_COMMANDS
];

module.exports = {
    BASEDIR_BLOCKWARE,
    BASEDIR_USER,
    USER_COMMANDS,
    BASEDIR_COMMANDS,
    DEFAULT_COMMANDS,
    CI_COMMANDS,
    ALL_COMMANDS
};