const inquirer = require('inquirer');
const reasons = require('./reasons');

module.exports = {
    collectWithdrawPayload
};

function collectWithdrawPayload(callback) {
    const chooseReasonQuestion = [
        {
            type: 'list',
            name: 'reason',
            message: 'Please choose your reason for the withdrawal: ',
            choices: Object.keys(reasons.REASON_CHOICES)
        }
    ];
    inquirer.prompt(chooseReasonQuestion).then((answers) => {
        const reasonEnum = reasons.REASON_CHOICES[answers.reason];
        if (reasonEnum !== 'OTHER') {
            callback(reasonEnum, null);
        } else {
            const otherReasonQuestion = [
                {
                    type: 'input',
                    name: 'message',
                    message: 'Your reason: '
                }
            ];
            inquirer.prompt(otherReasonQuestion).then((otherReasonAnswer) => {
                callback(reasonEnum, otherReasonAnswer.message);
            });
        }
    });
}
