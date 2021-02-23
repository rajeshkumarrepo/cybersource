function authenticationValidationStatusHandler(data) {
    console.log("Authentication message ----", data.consumerAuthenticationInformation.authenticationStatusMsg);
    if (data.consumerAuthenticationInformation.authenticationResult === "0" || data.consumerAuthenticationInformation.authenticationResult === "1") {
        return { "sucess": true, "error": false, "data": data };
    }
    else if (data.consumerAuthenticationInformation.authenticationResult === "9" || data.consumerAuthenticationInformation.authenticationResult === "-1") {
        return { "success": false, "message": "We are unable to process your request, please use a different payment option.", "error": data };
    }
    else if (data.consumerAuthenticationInformation.authenticationResult === "6") {
        return { "success": false, "message": "We are unable to process your request, please use a different payment option.", "error": data };
    }
    else return { "success": false, "error": "unknown" }
}

module.exports = authenticationValidationStatusHandler;