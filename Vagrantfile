# -*- mode: ruby -*-
# vi: set ft=ruby :

askFolder = 'ask-cli'
vagrantHome = '/home/vagrant'

Vagrant.configure("2") do |config|
    config.vm.box = "hashicorp/bionic64"
    config.vm.provision "shell", inline: <<-SCRIPT
    curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
    apt-get install -y nodejs
    cd #{askFolder}; npm link
    SCRIPT
    config.vm.synced_folder "#{Dir.home}/.ask", "#{vagrantHome}/.ask"
    config.vm.synced_folder "#{Dir.home}/.aws", "#{vagrantHome}/.aws"
    config.vm.synced_folder ".", "#{vagrantHome}/#{askFolder}"
end
