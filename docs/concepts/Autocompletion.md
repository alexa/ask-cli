# Autocompletion

## Prerequisites 

Autocompletion currently works for the following shells: bash, zsh and fish.

For bash, please install bash-completion.

```
brew install bash-completion
```

And the then add the following line to ~/.bash_profile or ~/.bashrc:

```
[[ -r "/usr/local/etc/profile.d/bash_completion.sh" ]] && . "/usr/local/etc/profile.d/bash_completion.sh"
```

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



