const inquirer = require("inquirer");
const questions = require("./questions");

module.exports = {
  confirmAllowSignIn,
  informReceivedError
};
export function confirmAllowSignIn(callback) {
  inquirer
    .prompt(questions.CONFIRM_ALLOW_BROWSER_SIGN_IN)
    .then((answer) => {
      callback(null, answer.choice);
    })
    .catch((error) => {
      callback(error);
    });
}

export function informReceivedError(callback, error) {
  inquirer
    .prompt([{...questions.INFORM_ERROR, message: `Sign in error: ${error}.`}])
    .then((answer) => {
      callback(null, answer.choice);
    })
    .catch((error) => {
      callback(error);
    });
}