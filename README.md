# Kapeta command line utility

Introduces using kapeta through blockctl commands. 

The purpose of ```blockctl``` is to make it simple to automate things 
either locally or on servers - 
as well as giving people comfortable with terminals a way to quickly perform
certain actions.

## Install / Update:
```bash
npm i @kapeta/blockctl -g
``` 

## Use:
```bash
blockctl help
``` 

## Remove
```bash
npm remove @kapeta/blockctl -g
``` 

## Structure
The tool itself is built up of a series of "commands". Each command is
its own module except for a few built-in core commands. 

### Installing or updating commands
It uses the NPM registry to install and update commands - and to install a new command
you can simply do 
```bash
blockctl install you-npm-command-module
```
or the short version
```bash
blockctl i you-npm-command-module
```

Upgrading is similar - simply write:
```bash
blockctl upgrade you-npm-command-module
```

### Extending
To implement a command for blockctl we use
[@kapeta/blockctl-command](https://github.com/blockwarecom/blockctl-command)
and the module must then be published as an NPM module for blockctl to install it

**blockctl** expects a ```command``` property in the ```package.json``` file
of the command. This command property should contain the *name* of your command -
e.g.
```json
{
  "name": "@kapeta/blockctl-command-codegen",
  "command": "codegen",
  ...
} 
```

Typically you'd want to not publish and download all the time during development. 
for that purpose you can navigate to the folder in which you are developing a command 
and run 
```bash
blockctl link [command-name]
```
The optional "command-name" parameter is to override what is in the 
```package.json``` file as mentioned before - or if nothing is there to 
specify one.

blockctl will then create a symlink - very similar to 
how ```npm link``` works - which allows it to find your local version of
the command.

