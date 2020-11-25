# Autocompletion

## Prerequisites 

Autocompletion currently works for the following shells: bash, zsh and fish.

### Bash prerequisites setup

1. Install bash-completion.

```
brew install bash-completion
```

2. Add bash_completion to ~/.bash_profile or ~/.bashrc:

```
echo '[[ -r "/usr/local/etc/profile.d/bash_completion.sh" ]] && . "/usr/local/etc/profile.d/bash_completion.sh"' >> ~/.bash_profile
```

Similar prerequisites steps can be run for zsh and fish shells.

## Enable Autocompletion
To setup auto completion, please run the following command and then restart the terminal.

```
ask autocomplete setup
```


## Disable Autocompletion
To disable auto completion, please run the following command and then restart the terminal.

```
ask autocomplete cleanup
```



