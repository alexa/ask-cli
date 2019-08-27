const git = require('simple-git');

module.exports = {
    clone
};

function clone(cloneUrl, branch, cloneDir, callback) {
    const cloneOption = [];
    if (branch) {
        cloneOption.push('-b');
        cloneOption.push(branch);
    }
    git().silent(true).clone(cloneUrl, cloneDir, cloneOption, (err) => {
        callback(err);
    });
}
