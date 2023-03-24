const inquirer = require("inquirer");
const acUtils = require("../../utils/ac-util");
const ResourcesConfig = require("../../model/resources-config");
const CONSTANTS = require("../../utils/constants");

module.exports = {
  confirmDeploymentIfNeeded,
};

/**
 * Confirms the deployment before deploying the skill.
 *
 * Confirmation is rendered when the skill project is Alexa Conversations, and the
 * last deployment type in ask-states is undefined or not Alexa Conversations.
 */
function confirmDeploymentIfNeeded(profile, callback) {
  const lastDeployType = ResourcesConfig.getInstance().getSkillMetaLastDeployType(profile);
  const isAcSkill = acUtils.isAcSkill(profile);

  // If last deployment was Alexa Conversations, then this prompt has already been answered
  const isPromptNeeded = isAcSkill && lastDeployType !== CONSTANTS.DEPLOYMENT_TYPE.ALEXA_CONVERSATIONS;

  if (isPromptNeeded) {
    inquirer
      .prompt([
        {
          message:
            "Skills with ACDL are not yet compatible with the https://developer.amazon.com, " +
            "hence this skill will be disabled on the Developer Console. Would you like to proceed?",
          type: "confirm",
          name: "confirmation",
          default: false,
        },
      ])
      .then((answer) => {
        callback(null, answer.confirmation);
      })
      .catch((error) => {
        callback(error);
      });
  } else {
    callback(null, true);
  }
}
