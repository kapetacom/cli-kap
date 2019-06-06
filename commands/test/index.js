class TestModule {

    performTest(someArg) {
        console.log('Performing test: ', someArg);
    }

    apply(program) {
        program.command('test <somearg>')
            .description('Test CLI')
            .action((somearg) => this.performTest(somearg));
    }
}

module.exports = new TestModule();