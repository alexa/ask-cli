/**
 * Maps testers email addressed to the correct spot in requestParameters.
 * @param {Object} requestParameters Request parameters.
 */
const mapTestersEmails = (requestParameters) => {
    const { testersEmails } = requestParameters;
    requestParameters.testersRequest = {
        testers: testersEmails.map(email => ({ emailId: email }))
    };

    delete requestParameters.testersEmails;
};

module.exports = mapTestersEmails;
