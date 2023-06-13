const inquirer = require("inquirer");
const questions = require("./questions");

module.exports = {
  confirmAllowSignIn,
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
