# Kapeta command line utility

Introduces using kapeta through command line commands. 

The purpose of ```kap``` is to make it simple to automate things 
either locally or on servers - 
as well as giving people comfortable with terminals a way to quickly perform
certain actions.

## Install / Update:
```bash
npm i @kapeta/kap -g
``` 

## Use:
```bash
kap help
``` 

## Remove
```bash
npm remove @kapeta/kap -g
``` 

## Structure
The tool itself is built up of a series of "commands". Each command is
its own module except for a few built-in core commands. 

### Installing or updating commands
It uses the NPM registry to install and update commands - and to install a new command
you can simply do 
```bash
kap install you-npm-command-module
```
or the short version
```bash
kap i you-npm-command-module
```

Upgrading is similar - simply write:
```bash
kap upgrade you-npm-command-module
```

### Extending
To implement a command for kap we use
[@kapeta/kap-command](https://github.com/kapetacom/cli-kap-command)
and the module must then be published as an NPM module for kap to install it

**kap** expects a ```command``` property in the ```package.json``` file
of the command. This command property should contain the *name* of your command -
e.g.
```json
{
  "name": "@kapeta/kap-command-codegen",
  "command": "codegen",
  ...
} 
```

Typically you'd want to not publish and download all the time during development. 
for that purpose you can navigate to the folder in which you are developing a command 
and run 
```bash
kap link [command-name]
```
The optional "command-name" parameter is to override what is in the 
```package.json``` file as mentioned before - or if nothing is there to 
specify one.    

kap will then create a symlink - very similar to 
how ```npm link``` works - which allows it to find your local version of
the command.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details