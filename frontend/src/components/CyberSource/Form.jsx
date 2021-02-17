import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import NumberFormat from 'react-number-format'
import { PrimaryInput, helpersFn, EargoButton } from '@eargo/eargo-components'
import { addScript, prepareRequest, removeElement, waitForScript } from '../../common/helpers'
import PaymentToken from './PaymentToken'
import { colorCodes } from '../../constant/colors'
import { devices } from '../../constant/devices'

const { handleErrOtherKey } = helpersFn
const { WHITE, ERROR_RED, GREY_1, GREY_2 } = colorCodes
const { mobile } = devices
var microform = {};
const fielsArray = ['name', 'expiration']

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
    .card-containers {
        height: 75px;
        border: #d9d9d9 1px solid;
        border-radius: 3px;
        display: flex;
        position: relative;
        @media ${mobile} {
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
        color: ${GREY_1};
        padding: 35px 0 0 24px;
        @media ${mobile} {
            padding: 30px 16px 24px 16px;
        }
    }
    .flex-container {
        display: flex;
        .card-exp-container  {
            @media ${mobile} {
                margin-bottom: 12px;
            }            
        }
        @media ${mobile} {
            flex-direction: column;
        }
        label {
            width: 50%;
            height: 75px;
            overflow: auto;
            @media ${mobile} {
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
        input.expiration {
            height: 100%;
            padding: 25px 0 0 24px;
            border: none;
            outline: none;
            color: ${GREY_1};
        }
        span.label, span.floating_label {
            padding-left: 24px;
            @media ${mobile} {
                padding-left: 16px;
            }
        }
    }
    .flex-microform-focused {
        background-color: ${WHITE};
        border: none;
        box-shadow: none;
    }
`;


const Form = styled.form`
max-width: 500px;
width: 100%;
margin: 0 auto;
`;

const InputHolder = styled.div`
padding-bottom: 12px;
@media ${mobile} {
    padding-bottom: 0px;
}
`;

const isExpirationValid = value => {
    if (!value) return false

    const newDate = value.split('/')
    if (!!newDate && newDate.length === 2) {
        const dateInstance = new Date()
        const currentMonth = dateInstance.getMonth().toString()
        const currentYear = dateInstance.getFullYear().toString()

        const monthVal = (Number(newDate[0]) - 1).toString()
        const yearVal = `20${newDate[1]}`
        return new Date(yearVal, monthVal) >= new Date(currentYear, currentMonth)
    }
    return false
}

const ElementWrapper = ({ label, children, labelClass, isValue }) => (
    <label className={`card-containers inputContainer cardholder-name ${labelClass}`}>
        <span className={`body1_light ${isValue ? 'floating_label' : 'label'}`}>
            {label}
        </span>
        {children}
    </label>
)


const CyberSourceForm = ({ captureContext }) => {

    const [cardState, setCardState] = useState({
        fields: {
            name: '',
            expiration: ''
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
                [type + 'Focus']: false
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
        const { fields: { expiration } } = cardState

        if (validateForm()) {
            handleCardState({ isProcessing: true })
            var errorsOutput = document.querySelector('#errors-output')
            const { fields: { number, securityCode } } = microform
            const expirationVal = expiration.split('/')
            if (!!number && !!securityCode) {
                microform.createToken({
                    expirationMonth: expirationVal[0],
                    expirationYear: `20${expirationVal[1]}`
                }, async function (err, token) {
                    if (err) {
                        if (!!err && !!err.details && !!err.details.length) {
                            (err.details).map(({ location, message }) => {
                                if (!!location && location === 'number') {
                                    setCardState((prevState) => {
                                        return ({
                                            ...prevState,
                                            [location + 'Error']: true,
                                            [location + 'Message']: message
                                        })
                                    })
                                }

                                if (!!location && ((location === 'expirationMonth') ||
                                    (location === 'expirationYear'))) {
                                    errors['expiration'] = message
                                    setCardState((prevState) => {
                                        return ({
                                            ...prevState,
                                            'expError': true,
                                            'expMessage': message
                                        })
                                    })
                                }

                                if (!!location && location === 'securityCode') {
                                    setCardState((prevState) => {
                                        return ({
                                            ...prevState,
                                            'cvcError': true,
                                            'cvcMessage': message
                                        })
                                    })
                                }
                            })
                        }
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
            handleCardState({ errors })
        }
    }

    const getFieldName = name => {
        switch (name) {
            case 'name':
                return 'Name'
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
            if (!cardState.fields[el]) {
                formIsValid = false
                errors[el] = `Please enter ${getFieldName(el)}`
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
                if (name === 'expiration') {
                    handleCardState({ expFocus: true })
                }

                !!errors['otherError'] && delete errors['otherError']
            }
        } else {
            delete errors[name] // Delete previous error and assign new one
            if (!fields[name]) {
                errors[name] = `Please enter ${getFieldName(name)}`;
            }

            if (name === 'expiration') {
                handleCardState({ expFocus: false })

                if (!!value && !isExpirationValid(value)) {
                    errors[name] = `Please enter valid ${getFieldName(name)}`;

                }

            }
            fields[name] = value.trim()
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
                const numberField = microform.createField('number', { placeholder: '' })
                numberField.on('focus', () => handleCSFocus('number'))
                numberField.on('blur', (data) => handleCSBlur('number', data))
                numberField.on('change', (data) => handleStripeChange('number', data))

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

    const { fields: { name, expiration }, errors, isProcessing, customerId, scriptLoaded,
        numberEmpty, numberError, numberFocus, numberMessage,
        expFocus, cvcEmpty, cvcError, cvcFocus, cvcMessage
    } = cardState

    let expirationValue;
    if (expiration.length > 5) {
        expirationValue = `${expiration.slice(0, 2)}/${expiration.slice(5, 7)}`;
    } else {
        expirationValue = expiration;
    }

    const cardExpiry = (val) => {
        let newval = val.substring(0, 2)
        const max = '12'
        if (newval.length === 1 && newval[0] > max[0]) {
            newval = `0${newval}`;
        }
        if (newval.length === 2) {
            if (Number(newval) === 0) {
                newval = '01';
            } else if (newval > max) {
                newval = max;
            }
        }
        const month = `${newval}/`;
        const year = val.substring(2, 4);
        return month + (year.length ? year : '');
    }

    const expFieldError = (!!errors && !!errors.expiration) ? errors.expiration : false
    if (!scriptLoaded)
        return null
    else if (!!customerId)
        return <PaymentToken token={customerId} />
    else
        return (
            <Container>
                <div className="card-body">
                    <div id="errors-output" role="alert"></div>
                    <Form onSubmit={handleSubmit}>
                        <InputHolder>
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
                        </InputHolder>

                        <InputHolder>
                            <ElementWrapper label={(!numberFocus && numberError) ? `Card Number ${numberMessage}` : 'Card Number'}
                                isValue={numberFocus || !numberEmpty}
                                labelClass={(!numberFocus && numberError) ? 'error_border' : ''}>
                                <div className='card-inputs' id="number-container" />
                            </ElementWrapper>
                        </InputHolder>
                        <InputHolder className="flex-container">
                            <ElementWrapper label={(!expFocus && expFieldError) ? expFieldError : 'Expiration'}
                                isValue={expFocus || (!!expiration)}
                                labelClass={` ${(!expFocus && expFieldError) ? 'error_border' : ''}`}>
                                <NumberFormat
                                    name="expiration"
                                    className='expiration'
                                    onChange={handleOnChange}
                                    format={cardExpiry}
                                    value={expirationValue}
                                    onFocus={handleFocusAndBlur}
                                    onBlur={e => handleFocusAndBlur(e, false)}
                                />
                            </ElementWrapper>
                            <ElementWrapper label={(!cvcFocus && cvcError) ? `CVC ${cvcMessage}` : 'CVC'}
                                isValue={cvcFocus || !cvcEmpty}
                                labelClass={(!cvcFocus && cvcError) ? 'error_border' : ''}>
                                <div className='card-inputs' id="securityCode-container" />
                            </ElementWrapper>
                        </InputHolder>
                        <Button type="submit" label={!!isProcessing ? 'Processing...' : 'Pay'} />
                    </Form>
                </div>
            </Container>
        )
}

export default CyberSourceForm