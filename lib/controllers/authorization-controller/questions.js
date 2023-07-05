module.exports = {
  CONFIRM_ALLOW_BROWSER_SIGN_IN: [
    {
      message: "Do you confirm that you used the browser to sign in to Alexa Skills Kit Tools?",
      type: "confirm",
      name: "choice",
      default: true,
    },
  ],
  INFORM_ERROR: {
    // message is filled out in code
    type: "list",
    choices: ["Ok"],
    name: "choice",
    default: "Ok",
  },
};
