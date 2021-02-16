import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { PrimaryInput, helpersFn, EargoButton } from '@eargo/eargo-components'
import { addScript, prepareRequest, removeElement, waitForScript } from '../../common/helpers'
import PaymentToken from './PaymentToken'
import { colorCodes } from '../../constant/colors'

const { handleErrOtherKey } = helpersFn
const { WHITE, ERROR_RED, GREY_1, GREY_2 } = colorCodes
var microform = {};
const fielsArray = ['name', 'expMonth', 'expYear']

// Custom styles that will be applied to each field we create using Microform
const myStyles = {
    'input': {
        'font-size': '18px',
        'color': GREY_1,
        'font-weight': '400'
    },
    ':disabled': { 'cursor': 'not-allowed' },
    'valid': { 'color': '#3c763d' },
    'invalid': { 'color': ERROR_RED }
}

const Button = styled(EargoButton)`
height: 40px;
width: 200px;
font-weight: 800;
`;


const Container = styled.div`
    card-name-container {
      margin-bottom: 20px;
      ::placeholder {
            color: ${GREY_2};
            opacity: 1;
        }
    }
    .padding-left-0 {
        padding-left: 0px;
    }
    .padding-left-24 {
        padding-left: 24px;
    }
    .card-containers {
        height: 75px;
        border: #d9d9d9 1px solid;
        border-radius: 3px;
        display: flex;
        position: relative;
        @media (max-width: 600px) {
            height: 60px;
            margin-bottom: 12px;
        }
        span.label {
            position: absolute;
            top: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            color: ${GREY_2};
            transform-origin: 0px 0px 0px;
            transition: transform 0.3s ease-out 0s;
        }
        span.floating_label {
            position: absolute;
            top: 0;
            color: ${GREY_2};
            transform-origin: 0px 0px 0px;
            transform: translateY(-1.5rem) scale(0.9);
            padding-top: 2.25rem;
            transition: transform 0.3s ease-out 0s;
          }
          &.error_border {
            border: 1px solid ${ERROR_RED};
            border-right: 1px solid ${ERROR_RED};
              span {
                color: ${ERROR_RED};
              }
          }          
    }
    .card-inputs {
        width: 100%;
        padding: 35px 0 0 24px;
        @media (max-width: 600px) {
            padding: 30px 16px 24px 16px;
        }
    }
    .flex-container {
        display: flex;
        .card-exp-container  {
            @media (max-width: 600px) {
                margin-bottom: 12px;
            }            
        }
        @media (max-width: 600px) {
            flex-direction: column;
        }
        label {
            width: 50%;
            height: 75px;
            overflow: auto;
            @media (max-width: 600px) {
                width: 99%;
                height: 60px;
            }
        }
    }
    .name-input {
        width: 100%;
        padding-left: 24px;
    }
    .cardholder-name {
        .expiration-dual-input {
            input.expMonth {
                padding: 25px 0 0 24px;
            }
            input {
                border: none;
                outline: none;
            }
        }
        span.label, span.floating_label {
            padding-left: 24px;
            @media (max-width: 600px) {
                padding-left: 16px;
            }
        }
    }
    .card-exp-container, .card-cvc-container {
        margin-bottom: 0px;
        border-radius: 0px;
    }
    .card-exp-container {
        border-top-left-radius: 3px;
        border-bottom-left-radius: 3px;
        @media (max-width: 600px) {
            border-radius: 3px;
        }
    }
    .card-cvc-container {
        border-top-right-radius: 3px;
        border-bottom-right-radius: 3px;
        @media (max-width: 600px) {
            border-radius: 3px;
        }
    }
    .flex-microform-focused {
        background-color: ${WHITE};
        border: none;
        box-shadow: none;
    }
`;

const SepratorSlash = styled.span`
margin-left: 5px;
margin-right: 5px;
`;

const ElementWrapper = ({ label, children, labelClass, isValue }) => (
    <label className={`card-containers inputContainer cardholder-name padding-left-0 ${labelClass}`}>
        <span className={`body1_light ${isValue ? 'floating_label padding-left-24' : 'label'}`}>
            {label}
        </span>
        {children}
    </label>
)


const CyberSourceForm = ({ captureContext }) => {

    const [cardState, setCardState] = useState({
        fields: {
            expMonth: '',
            expYear: ''
        },
        errors: {},
        customerId: false,
        scriptLoaded: false,
        isProcessing: false,
        numberFocus: false,
        numberVal: false,
        numberError: false,
        numberEmpty: true,
        numberMessage: '',
        expFocus: false,
        cvcFocus: false,
        cvcVal: false,
        cvcError: false,
        cvcEmpty: true,
        cvcMessage: '',
    })

    const handleCardState = newState => {
        setCardState((prevState) => {
            return ({
                ...prevState,
                ...newState
            })
        })
    }

    const handleCSFocus = type => {
        setCardState((prevState) => {
            return ({
                ...prevState,
                [type + 'Focus']: true
            })
        })
    }

    const handleCSBlur = (type) => {
        setCardState((prevState) => {
            return ({
                ...prevState,
                [type + 'Focus']: false,
                // [type + 'Error']: true,
                // [type + 'Empty']: true,
                // [type + 'Message']: typeMessage
                // [type + 'Error']: !typeVal ? true : _invalid,
                // [type + 'Empty']: !typeVal,
                // [type + 'Message']: !typeVal ? 'is required' : 'is not valid'
            })
        })
    }

    const handleStripeChange = (type, data) => {
        const { empty, valid } = data
        setCardState((prevState) => {
            return ({
                ...prevState,
                [type + 'Error']: empty ? true : !valid,
                [type + 'Empty']: empty,
                [type + 'Message']: empty ? 'is required' : 'is not valid'
            })
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        let errors = {};
        const { fields: { expMonth, expYear } } = cardState
        handleCardState({ isProcessing: true })

        if (validateForm()) {
            var errorsOutput = document.querySelector('#errors-output')
            const { fields: { number, securityCode } } = microform

            if (!!number && !!securityCode) {
                microform.createToken({
                    expirationMonth: expMonth,
                    expirationYear: `20${expYear}`
                }, async function (err, token) {
                    if (err) {
                        // handle error
                        console.error(err);
                        errorsOutput.textContent = err.message;
                    } else {
                        try {
                            const resp = await prepareRequest('POST', '/create_tms_token',
                                JSON.stringify({ flexresponse: token }))
                            if (!!resp && !!resp.success && !!resp.data && !!resp.data.token) {
                                handleCardState({ customerId: resp.data.token })
                            } else {
                                handleCardState({ customerId: false })
                            }
                        } catch (error) {
                            const errorBag = !!error.responseJSON && !!error.responseJSON.error ? error.responseJSON.error : (
                                !!error.responseJSON && !!error.responseJSON[0] ? error.responseJSON[0] : "Something went wrong, Please try again."
                            )
                            errors = handleErrOtherKey(errorBag)
                        }
                    }
                    handleCardState({ isProcessing: false })
                })
            }
            handleCardState({ errors, isProcessing: false })
        }
        handleCardState({ isProcessing: false })
    }

    const getFieldName = name => {
        switch (name) {
            case 'name':
                return 'Name'
            case 'expMonth':
                return 'Expiry Month'
            case 'expYear':
                return 'Expiry Year'
            case 'expiration':
                return 'Expiration'
            default:
                break;
        }
    }

    const validateForm = () => {
        let errors = {};
        let formIsValid = true;

        for (let el of fielsArray) {
            if (((el === 'expMonth') || (el === 'expYear')) && !cardState.fields[el]) {
                handleCardState({
                    expError: true,
                    expMessage: 'Value is required'
                })
            } else if (!cardState.fields[el]) {
                formIsValid = false;
                errors[el] = `Please enter ${getFieldName(el)}`;
            }
        }

        handleCardState({ errors });
        return formIsValid;
    }

    const handleOnChange = async ({ target: { name, value } }) => {
        let fields = cardState.fields
        let errors = cardState.errors
        fields[name] = value
        !!errors['otherError'] && delete errors['otherError']
        handleCardState({ fields, errors })
    }

    /**
    * Handle Focus and Blur both event for form
    * @param {Event} e 
    * @param {Boolean} onFocus 
    */
    const handleFocusAndBlur = async (e, onFocus = true) => {

        // Store fields and erros value for state in a variable
        let fields = cardState.fields;
        let errors = cardState.errors
        const { name, value } = e.target // Get name and value to event parameter

        if (onFocus) { // Handle onFocus event

            // Delete focused input errors and other error also
            if (!!errors) {
                !!errors[name] && delete errors[name]

                if ((name === 'expMonth') || (name === 'expYear')) {
                    handleCardState({
                        expError: false,
                        expMessage: false
                    })
                }
                !!errors['otherError'] && delete errors['otherError']
            }
        } else {
            delete errors[name] // Delete previous error and assign new one
            if (((name === 'expMonth') || (name === 'expYear')) && !fields[name]) {
                handleCardState({
                    expError: true,
                    expMessage: 'Value is required'
                })
            } else if (!fields[name]) {
                errors[name] = `Please enter your ${name}`;
            }

            fields[name] = value.trim();
        }
        handleCardState({ errors, fields })
    }

    useEffect(() => {
        addScript('https://flex.cybersource.com/cybersource/assets/microform/0.11/flex-microform.min.js', 'cyber-source-script')

        waitForScript('Flex').then(res => {
            if (!!res) {
                handleCardState({ scriptLoaded: true })
                const { Flex } = window
                var flex = new Flex(captureContext)
                microform = flex.microform({ styles: myStyles })
                console.log("microform ", microform)
                const numberField = microform.createField('number', { placeholder: '' })
                numberField.on('focus', () => handleCSFocus('number'))
                numberField.on('blur', (data) => handleCSBlur('number', data))
                numberField.on('change', (data) => handleStripeChange('number', data))

                console.log("numberField ", numberField)
                numberField.load('#number-container')
                const securityCode = microform.createField('securityCode', { placeholder: '' })
                securityCode.load('#securityCode-container')

                securityCode.on('focus', () => handleCSFocus('cvc'))
                securityCode.on('blur', (data) => handleCSBlur('cvc', data))
                securityCode.on('change', (data) => handleStripeChange('cvc', data))

                return true
            }
        })

        return () => {
            removeElement('cyber-source-script')
        }
    }, [])

    const { fields: { name, expMonth, expYear }, errors, isProcessing, customerId, scriptLoaded,
        numberEmpty, numberError, numberFocus, numberMessage,
        expFocus, expError, expMessage, cvcEmpty, cvcError, cvcFocus, cvcMessage
    } = cardState

    if (!scriptLoaded)
        return null
    else if (!!customerId)
        return <PaymentToken token={customerId} />
    else
        return (
            <Container className="container card">
                <div className="card-body">
                    <h1>Checkout</h1>
                    <div id="errors-output" role="alert"></div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <div className='eargo-login-in-primary-input'>
                                <PrimaryInput
                                    id="name"
                                    name="name"
                                    errClass={!!errors && !!errors.name ? 'error_border' : ''}
                                    label={!!errors && !!errors.name ? errors.name : 'Name'}
                                    handleOnChange={handleOnChange}
                                    value={name || ''}
                                    handleOnFocus={handleFocusAndBlur}
                                    handleOnBlur={e => handleFocusAndBlur(e, false)}
                                />
                            </div>

                            <ElementWrapper label={(!numberFocus && numberError) ? `Card Number ${numberMessage}` : 'Card Number'}
                                isValue={numberFocus || !numberEmpty}
                                labelClass={`card-number-container ${(!numberFocus && numberError) ? 'error_border' : ''}`}>
                                <div className='card-inputs' id="number-container" />
                            </ElementWrapper>
                        </div>
                        <div className="flex-container">
                            <ElementWrapper label={(!expFocus && expError) ? `MM/YY ${expMessage}` : 'MM/YY'}
                                isValue={expFocus || (!!expMonth || !!expYear)}
                                labelClass={`card-number-container ${(!expFocus && expError) ? 'error_border' : ''}`}>
                                <span className="expiration-dual-input">
                                    <input type="text" className="expMonth" name="expMonth" maxLength="2" size="2"
                                        onChange={handleOnChange}
                                        onFocus={(e) => {
                                            handleCSFocus('exp')
                                            handleFocusAndBlur(e)
                                        }}
                                        onBlur={(e) => {
                                            handleCSBlur('exp')
                                            handleFocusAndBlur(e, false)
                                        }}
                                    />
                                    {(!!expMonth || !!expYear) && <SepratorSlash>/</SepratorSlash>}
                                    <input type="text" name="expYear" maxLength="2" size="2"
                                        onChange={handleOnChange}
                                        onFocus={(e) => {
                                            handleCSFocus('exp')
                                            handleFocusAndBlur(e)
                                        }}
                                        onBlur={(e) => {
                                            handleCSBlur('exp')
                                            handleFocusAndBlur(e, false)
                                        }}
                                    />
                                </span>

                            </ElementWrapper>
                            <ElementWrapper label={(!cvcFocus && cvcError) ? `CVC ${cvcMessage}` : 'CVC'}
                                isValue={cvcFocus || !cvcEmpty}
                                labelClass={`card-number-container ${(!cvcFocus && cvcError) ? 'error_border' : ''}`}>
                                <div className='card-inputs' id="securityCode-container" />
                            </ElementWrapper>
                        </div>
                        <Button type="submit" label={!!isProcessing ? 'Processing...' : 'Pay'} />
                    </form>
                </div>
            </Container>
        )
}

export default CyberSourceForm