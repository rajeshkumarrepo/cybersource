var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var cybersourceRestApi = require('cybersource-rest-client');
const { error } = require('console');

// common parameters
const AuthenticationType = 'http_signature';
const RunEnvironment = 'cybersource.environment.SANDBOX';

const MerchantId = 'testrest';
const MerchantKeyId = '08c94330-f618-42a3-b09d-e1e43be5efda';
const MerchantSecretKey = 'yBJxy6LjM2TmcPGu+GaJrHtkke25fPpUX+UY6/L/1tE=';

// jwt parameters
const KeysDirectory = 'Resource';
const KeyFileName = 'testrest';
const KeyAlias = 'testrest';
const KeyPass = 'testrest';

// logging parameters
const EnableLog = true;
const LogFileName = 'cybs';
const LogDirectory = '../log';
const LogfileMaxSize = '5242880'; //10 MB In Bytes


var configObj = {
    'authenticationType': AuthenticationType,
    'runEnvironment': RunEnvironment,

    'merchantID': MerchantId,
    'merchantKeyId': MerchantKeyId,
    'merchantsecretKey': MerchantSecretKey,

    'keyAlias': KeyAlias,
    'keyPass': KeyPass,
    'keyFileName': KeyFileName,
    'keysDirectory': KeysDirectory,

    'enableLog': EnableLog,
    'logFilename': LogFileName,
    'logDirectory': LogDirectory,
    'logFileMaxSize': LogfileMaxSize
};


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// THIS IS THE SERVER-SIDE REQUEST TO GENERATE THE DYNAMIC KEY 
// REQUIRED FOR THE MICROFORM TO TOKENIZE
app.get('/checkout', function (req, res) {

    try {
        var apiClient = new cybersourceRestApi.ApiClient();
        var requestObj = new cybersourceRestApi.GeneratePublicKeyRequest();

        requestObj.encryptionType = 'RsaOaep256';
        // requestObj.targetOrigin = 'http://localhost:3000';
        requestObj.targetOrigin = (req.headers.referer).replace(/\/$/, "")
        var format = "JWT";

        var instance = new cybersourceRestApi.KeyGenerationApi(configObj, apiClient);

        console.log('\n*************** Generate Key ********************* ');

        instance.generatePublicKey(format, requestObj, function (error, data, response) {
            if (error) {
                console.log('Error : ' + error);
                console.log('Error status code : ' + error.statusCode);
            }
            else if (data) {
                console.log('Data : ' + JSON.stringify(data));
                console.log('CaptureContext: ' + data.keyId);
                // res.render('index', { keyInfo: JSON.stringify(data.keyId) });
                return res.send({ success: true, data: { keyInfo: data.keyId } });
            }
            console.log('Response : ' + JSON.stringify(response));
            console.log('Response Code Of GenerateKey : ' + response['status']);
            // callback(error, data);
        });

    } catch (error) {
        console.log(error);
    }

});

// THIS ROUTE SIMPLY POWERS THE TOKEN PAGE TO DISPLAY THE TOKEN
// NOTE THIS IS AN INTERIM STEP FOR THE SAMPLE AND WOULD OBVIOUSLY
// NOT BE PART OR A REAL CHECKOUT FLOW
app.post('/token', function (req, res) {

    try {

        console.log('Response : ' + req.body.flexresponse);
        var tokenResponse = JSON.parse(req.body.flexresponse)

        // res.render('token', { flexresponse: req.body.flexresponse });
        return res.send({ success: true, data: { flexresponse: req.body.flexresponse } });

    } catch (error) {
        res.send('Error : ' + error + ' Error status code : ' + error.statusCode);
    }


});

// THIS REPRESENTS THE SERVER-SIDE REQUEST TO MAKE A PAYMENT WITH THE TRANSIENT
// TOKEN
app.post('/receipt', async function (req, res) {

    var tokenResponse = JSON.parse(req.body.flexresponse)
    console.log('Transient token for payment is: ' + JSON.stringify(tokenResponse));

    try {

        var instance = new cybersourceRestApi.PaymentsApi(configObj);

        var clientReferenceInformation = new cybersourceRestApi.Ptsv2paymentsClientReferenceInformation();
        clientReferenceInformation.code = 'test_flex_payment';

        var processingInformation = new cybersourceRestApi.Ptsv2paymentsProcessingInformation();
        processingInformation.commerceIndicator = 'internet';

        var amountDetails = new cybersourceRestApi.Ptsv2paymentsOrderInformationAmountDetails();
        amountDetails.totalAmount = '102.21';
        amountDetails.currency = 'USD';

        var billTo = new cybersourceRestApi.Ptsv2paymentsOrderInformationBillTo();
        billTo.country = 'US';
        billTo.firstName = 'John';
        billTo.lastName = 'Deo';
        billTo.phoneNumber = '4158880000';
        billTo.address1 = 'test';
        billTo.postalCode = '94105';
        billTo.locality = 'San Francisco';
        billTo.administrativeArea = 'MI';
        billTo.email = 'test@cybs.com';
        billTo.address2 = 'Address 2';
        billTo.district = 'MI';
        billTo.buildingNumber = '123';

        var orderInformation = new cybersourceRestApi.Ptsv2paymentsOrderInformation();
        orderInformation.amountDetails = amountDetails;
        orderInformation.billTo = billTo;

        // EVERYTHING ABOVE IS JUST NORMAL PAYMENT INFORMATION
        // THIS IS WHERE YOU PLUG IN THE MICROFORM TRANSIENT TOKEN
        var tokenInformation = new cybersourceRestApi.Ptsv2paymentsTokenInformation();
        tokenInformation.transientTokenJwt = tokenResponse;

        var request = new cybersourceRestApi.CreatePaymentRequest();
        request.clientReferenceInformation = clientReferenceInformation;
        request.processingInformation = processingInformation;
        request.orderInformation = orderInformation;
        request.tokenInformation = tokenInformation;

        console.log('\n*************** Process Payment ********************* ');

        instance.createPayment(request, function (error, data, response) {
            if (error) {
                console.log('\nError in process a payment : ' + JSON.stringify(error));
            }
            else if (data) {
                console.log('\nData of process a payment : ' + JSON.stringify(data));
                res.render('receipt', { paymentResponse: JSON.stringify(data) });

            }
            console.log('\nResponse of process a payment : ' + JSON.stringify(response));
            console.log('\nResponse Code of process a payment : ' + JSON.stringify(response['status']));
            // callback(error, data);
        });

    } catch (error) {
        console.log(error);
    }

});

app.post('/payer-auth-setup', function (req, res) {
    console.log("payer-auth-setup req body ------", req.body)
    var token = req.body.token//JSON.parse(req.body.token);
    console.log('Token for payment is: ' + token);
    try {

        var instance = new cybersourceRestApi.PayerAuthenticationApi(configObj);
        var requestObj = new cybersourceRestApi.PayerAuthSetupRequest();

        var paymentInformation = new cybersourceRestApi.Riskv1authenticationsetupsPaymentInformation();
        var paymentInformationCustomer = new cybersourceRestApi.Riskv1authenticationsetupsPaymentInformationCustomer();
        paymentInformationCustomer.customerId = token//"BB262E072B0A32F3E05341588E0AA885";
        paymentInformation.customer = paymentInformationCustomer;

        requestObj.paymentInformation = paymentInformation;

        var clientReferenceInformation = new cybersourceRestApi.Riskv1authenticationsetupsClientReferenceInformation();
        clientReferenceInformation.code = 'UNKNOWN';
        requestObj.clientReferenceInformation = clientReferenceInformation;

        console.log('\n*************** payerAuthSetup ********************* ', requestObj);

        instance.payerAuthSetup(requestObj, function (error, data, response) {
            console.log('\nResponse of payerAuthSetup : ' + JSON.stringify(response));
            console.log('\nResponse Code of payerAuthSetup : ' + JSON.stringify(response['status']));
            if (error) {
                console.log('\nError in payerAuthSetup : ' + JSON.stringify(error));
                res.render("error", {
                    "message": error.message,
                    "error": error
                })
            }
            else if (data) {
                console.log('\nData of payerAuthSetup : ' + JSON.stringify(data));
                // res.render('device_data_collection', {
                //     url: JSON.stringify(data.consumerAuthenticationInformation.deviceDataCollectionUrl),
                //     accesstoken: JSON.stringify(data.consumerAuthenticationInformation.accessToken),
                //     token: JSON.stringify(token),
                //     reference_id: JSON.stringify(data.consumerAuthenticationInformation.referenceId),
                //     return_url: JSON.stringify("http://localhost:3000/authentication_validation")
                // });

                return res.send({
                    success: true, data: {
                        url: data.consumerAuthenticationInformation.deviceDataCollectionUrl,
                        accesstoken: data.consumerAuthenticationInformation.accessToken,
                        token,
                        reference_id: data.consumerAuthenticationInformation.referenceId,
                        return_url: "http://localhost:3000/authentication_validation"
                    }
                });
            }
        });

    } catch (error) {
        console.log(error);
    }
})

app.post('/check-enrollment', function (req, res) {
    try {
        console.log("check-enrollment req body ----", req.body);
        var requestObj = new cybersourceRestApi.CheckPayerAuthEnrollmentRequest();

        var consumerAuthenticationInformation = new cybersourceRestApi.Ptsv2paymentsConsumerAuthenticationInformation();
        consumerAuthenticationInformation.returnUrl = req.body.return_url;
        consumerAuthenticationInformation.referenceId = req.body.reference_id;
        requestObj.consumerAuthenticationInformation = consumerAuthenticationInformation;

        var clientReferenceInformation = new cybersourceRestApi.Riskv1authenticationsetupsClientReferenceInformation();
        clientReferenceInformation.code = 'UNKNOWN';
        requestObj.clientReferenceInformation = clientReferenceInformation;

        var orderInformation = new cybersourceRestApi.Riskv1authenticationsOrderInformation();
        var orderInformationAmountDetails = new cybersourceRestApi.Riskv1authenticationsOrderInformationAmountDetails();
        orderInformationAmountDetails.currency = 'USD';
        orderInformationAmountDetails.totalAmount = '10.99';
        orderInformation.amountDetails = orderInformationAmountDetails;

        var orderInformationBillTo = new cybersourceRestApi.Riskv1authenticationsOrderInformationBillTo();
        orderInformationBillTo.address1 = '1 Market St';
        orderInformationBillTo.address2 = 'Address 2';
        orderInformationBillTo.administrativeArea = 'CA';
        orderInformationBillTo.country = 'US';
        orderInformationBillTo.locality = 'san francisco';
        orderInformationBillTo.firstName = 'John';
        orderInformationBillTo.lastName = 'Doe';
        orderInformationBillTo.phoneNumber = '4158880000';
        orderInformationBillTo.email = 'test@cybs.com';
        orderInformationBillTo.postalCode = '94105';
        orderInformation.billTo = orderInformationBillTo;

        requestObj.orderInformation = orderInformation;

        var paymentInformation = new cybersourceRestApi.Riskv1authenticationsetupsPaymentInformation();
        var paymentInformationCustomer = new cybersourceRestApi.Riskv1authenticationsetupsPaymentInformationCustomer();
        paymentInformationCustomer.customerId = req.body.token;
        paymentInformation.customer = paymentInformationCustomer;

        requestObj.paymentInformation = paymentInformation;

        var instance = new cybersourceRestApi.PayerAuthenticationApi(configObj);

        instance.checkPayerAuthEnrollment(requestObj, function (error, data, response) {
            if (error) {
                console.log('\nError : ' + JSON.stringify(error));
            }
            else if (data) {
                console.log('\n --------- Data : ' + JSON.stringify(data));
                console.log("Authentication Status", data.status)
            }

            console.log('\nResponse : ' + JSON.stringify(response));
            console.log('\nResponse Code of Check Payer Auth Enrollment : ' + JSON.stringify(response['status']));
            if (data.status === "PENDING_AUTHENTICATION") {
                // res.render("step_up", { "jwt": JSON.stringify(data.consumerAuthenticationInformation.accessToken), "stepup_url": JSON.stringify(data.consumerAuthenticationInformation.stepUpUrl) });
                return res.send({ success: true, data: { "jwt": data.consumerAuthenticationInformation.accessToken, "stepup_url": data.consumerAuthenticationInformation.stepUpUrl } });
            } else {
                // res.render("result", { "error": JSON.stringify(error), "data": JSON.stringify(data) });
                return res.send({ success: true, data: { "error": JSON.stringify(error), "data": JSON.stringify(data) } });
            }
        });
    }
    catch (error) {
        console.log('\nException on calling the API : ' + error);
    }
})

app.post('/authentication_validation', function (req, res) {
    console.log("authentication_validation req body ----", req.body);
    try {
        var requestObj = new cybersourceRestApi.ValidateRequest();

        var clientReferenceInformation = new cybersourceRestApi.Riskv1authenticationsetupsClientReferenceInformation();
        clientReferenceInformation.code = 'UNKNOWN';
        requestObj.clientReferenceInformation = clientReferenceInformation;

        // var orderInformation = new cybersourceRestApi.Riskv1authenticationresultsOrderInformation();
        // var orderInformationAmountDetails = new cybersourceRestApi.Riskv1authenticationsOrderInformationAmountDetails();
        // orderInformationAmountDetails.currency = 'USD';
        // orderInformationAmountDetails.totalAmount = '200.00';
        // orderInformation.amountDetails = orderInformationAmountDetails;


        // var lineItems = new Array();
        // var lineItems1 = new cybersourceRestApi.Riskv1authenticationresultsOrderInformationLineItems();
        // lineItems1.unitPrice = '10';
        // lineItems1.quantity = 2;
        // lineItems1.taxAmount = '32.40';
        // lineItems.push(lineItems1);

        // orderInformation.lineItems = lineItems;

        // requestObj.orderInformation = orderInformation;

        var consumerAuthenticationInformation = new cybersourceRestApi.Riskv1authenticationresultsConsumerAuthenticationInformation();
        consumerAuthenticationInformation.authenticationTransactionId = req.body.TransactionId;
        // consumerAuthenticationInformation.signedPares = 'eNqdmFmT4jgSgN+J4D90zD4yMz45PEFVhHzgA2zwjXnzhQ984Nvw61dAV1';
        requestObj.consumerAuthenticationInformation = consumerAuthenticationInformation;


        var instance = new cybersourceRestApi.PayerAuthenticationApi(configObj);

        instance.validateAuthenticationResults(requestObj, function (error, data, response) {
            if (error) {
                console.log('\nError : ' + JSON.stringify(error));
            }
            else if (data) {
                console.log('\nData : ' + JSON.stringify(data));
            }

            console.log('\nResponse : ' + JSON.stringify(response));
            console.log('\nResponse Code of Validate Authentication Results : ' + JSON.stringify(response['status']));
            res.render("result", { "error": JSON.stringify(error), "data": JSON.stringify(data) });
        });
    }
    catch (error) {
        console.log('\nException on calling the API : ' + error);
    }
})

app.post('/create_tms_token', function (req, res) {
    console.log("in create tms token ------", req.body);
    var token = req.body.flexresponse
    try {
        var requestObj = new cybersourceRestApi.PayerAuthSetupRequest();

        var clientReferenceInformation = new cybersourceRestApi.Ptsv2paymentsClientReferenceInformation();
        clientReferenceInformation.code = 'UNKNOWN';
        requestObj.clientReferenceInformation = clientReferenceInformation;

        var processingInformation = new cybersourceRestApi.Ptsv2paymentsProcessingInformation();

        var actionList = new Array();
        actionList.push("TOKEN_CREATE");
        processingInformation.actionList = actionList;


        var actionTokenTypes = new Array();
        actionTokenTypes.push('customer');
        actionTokenTypes.push("paymentInstrument");
        actionTokenTypes.push("shippingAddress");
        processingInformation.actionTokenTypes = actionTokenTypes;

        processingInformation.capture = false;
        requestObj.processingInformation = processingInformation;

        var orderInformation = new cybersourceRestApi.Ptsv2paymentsOrderInformation();
        var orderInformationAmountDetails = new cybersourceRestApi.Ptsv2paymentsOrderInformationAmountDetails();
        orderInformationAmountDetails.totalAmount = '0.0';
        orderInformationAmountDetails.currency = 'USD';
        orderInformation.amountDetails = orderInformationAmountDetails;

        var orderInformationBillTo = new cybersourceRestApi.Ptsv2paymentsOrderInformationBillTo();
        orderInformationBillTo.firstName = 'John';
        orderInformationBillTo.lastName = 'Doe';
        orderInformationBillTo.address1 = '1 Market St';
        orderInformationBillTo.locality = 'san francisco';
        orderInformationBillTo.administrativeArea = 'CA';
        orderInformationBillTo.postalCode = '94105';
        orderInformationBillTo.country = 'US';
        orderInformationBillTo.email = 'test@cybs.com';
        orderInformationBillTo.phoneNumber = '4158880000';
        orderInformation.billTo = orderInformationBillTo;

        var orderInformationShipTo = new cybersourceRestApi.Ptsv2paymentsOrderInformationShipTo();
        orderInformationShipTo.firstName = 'John';
        orderInformationShipTo.lastName = 'Doe';
        orderInformationShipTo.address1 = '1 Market St';
        orderInformationShipTo.locality = 'san francisco';
        orderInformationShipTo.administrativeArea = 'CA';
        orderInformationShipTo.postalCode = '94105';
        orderInformationShipTo.country = 'US';
        orderInformation.shipTo = orderInformationShipTo;

        requestObj.orderInformation = orderInformation;

        var tokenInformation = new cybersourceRestApi.Ptsv2paymentsTokenInformation();
        tokenInformation.transientTokenJwt = token;
        console.log("token ---------", token);
        requestObj.tokenInformation = tokenInformation;

        var instance = new cybersourceRestApi.PaymentsApi(configObj);

        const response = instance.createPayment(requestObj, function (error, data, response) {
            console.log('\nResponse : ' + JSON.stringify(response));
            console.log('\nResponse Code of Process a Payment : ' + JSON.stringify(response['status']));
            if (error) {
                console.log('\nError : ' + JSON.stringify(error));
            }
            else if (data) {
                console.log('\nData : ' + JSON.stringify(data));
                // res.render("token", {
                //     token: JSON.stringify(data.tokenInformation.customer.id),
                // })
                return res.send({
                    success: true, data: {
                        token: data.tokenInformation.customer.id,
                    }
                })
            }
        });
    }
    catch (error) {
        console.log('\nException on calling the API : ' + error);
        return { "error": error };
    }
})
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;