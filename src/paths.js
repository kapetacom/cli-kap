const ClusterConfiguration = require("@kapeta/local-cluster-config");
const Path = require("path");
const BASEDIR_KAPETA = ClusterConfiguration.getKapetaBasedir();

const BASEDIR_USER = Path.join(BASEDIR_KAPETA, 'blockctl');
const USER_COMMANDS = Path.join(BASEDIR_USER , 'commands.json');
const BASEDIR_COMMANDS = Path.join(BASEDIR_USER, 'commands');

const DEFAULT_COMMANDS = Path.normalize(Path.join(__dirname , '/../default-commands.json'));
const CI_COMMANDS = Path.normalize(Path.join(__dirname , '/../ci-commands.json'));

const ALL_COMMANDS = [
    USER_COMMANDS,
    process.env.KAPETA_CI ? CI_COMMANDS : DEFAULT_COMMANDS
];

module.exports = {
    BASEDIR_KAPETA,
    BASEDIR_USER,
    USER_COMMANDS,
    BASEDIR_COMMANDS,
    DEFAULT_COMMANDS,
    CI_COMMANDS,
    ALL_COMMANDS
};
