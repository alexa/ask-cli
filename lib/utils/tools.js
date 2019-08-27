module.exports = {
    convertDataToJsonObject
};

function convertDataToJsonObject(data) {
    let response = data;
    try {
        if (typeof data === 'string') {
            response = JSON.parse(data);
        }
    } catch (e) {
        if (data.length <= 5000) {
            console.error(`Failed to parse the JSON from string ${data}.`);
        } else {
            console.error('Failed to parse the JSON from string.');
        }
        return null;
    }
    return response;
}
