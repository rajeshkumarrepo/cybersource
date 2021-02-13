import React, { useEffect, useState } from 'react'
import { addScript, prepareRequest, removeElement, waitForScript } from '../../common/helpers'
import PaymentToken from './PaymentToken'

var microform = {};

// Custom styles that will be applied to each field we create using Microform
const myStyles = {
    'input': {
        'font-size': '14px',
        'font-family': 'helvetica, tahoma, calibri, sans-serif',
        'color': '#555'
    },
    ':focus': { 'color': 'blue' },
    ':disabled': { 'cursor': 'not-allowed' },
    'valid': { 'color': '#3c763d' },
    'invalid': { 'color': '#a94442' }
}

const monthList = [...Array(12).keys()]

const CyberSourceForm = ({ captureContext }) => {
    const [expMonth, setExpMonth] = useState('05')
    const [expYear, setExpYear] = useState('2021')
    const [isProcessing, setIsProcessing] = useState(false)
    const [customerId, setCustomerId] = useState(false)
    const [scriptLoaded, setScriptLoaded] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsProcessing(true)
        var errorsOutput = document.querySelector('#errors-output')
        const { fields: { number, securityCode } } = microform

        if (!!number && !!securityCode) {
            microform.createToken({
                expirationMonth: expMonth,
                expirationYear: expYear
            }, async function (err, token) {
                if (err) {
                    // handle error
                    console.error(err);
                    errorsOutput.textContent = err.message;
                } else {
                    const resp = await prepareRequest('POST', '/create_tms_token',
                        JSON.stringify({ flexresponse: token }))
                    if (!!resp && !!resp.success && !!resp.data && !!resp.data.token) {
                        setCustomerId(resp.data.token)
                    } else {
                        setCustomerId(false)
                    }
                }
                setIsProcessing(false)
            }
            )
        }
    }

    useEffect(() => {
        addScript('https://flex.cybersource.com/cybersource/assets/microform/0.11/flex-microform.min.js', 'cyber-source-script')

        waitForScript('Flex').then(res => {
            if (!!res) {
                setScriptLoaded(true)
                const { Flex } = window
                var flex = new Flex(captureContext)
                microform = flex.microform({ styles: myStyles })
                const numberField = microform.createField('number', { placeholder: 'Enter card number' })
                numberField.load('#number-container')
                const securityCode = microform.createField('securityCode', { placeholder: '•••' })
                securityCode.load('#securityCode-container')
                return true
            }
        })

        return () => {
            removeElement('cyber-source-script')
        }
    }, [])

    if (!scriptLoaded)
        return null
    else if (!!customerId)
        return <PaymentToken token={customerId} />
    else
        return (
            <div className="container card">
                <div className="card-body">
                    <h1>Checkout</h1>
                    <div id="errors-output" role="alert"></div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="cardholderName">Name</label>
                            <input id="cardholderName" className="form-control" name="cardholderName" placeholder="Name on the card" />
                            <label id="cardNumber-label">Card Number</label>
                            <div id="number-container" className="form-control"></div>
                            <label htmlFor="securityCode-container">Security Code</label>
                            <div id="securityCode-container" className="form-control"></div>
                        </div>

                        <div className="form-row">
                            <div className="form-group col-md-6">
                                <label htmlFor="expMonth">Expiry month</label>
                                <select id="expMonth" value={expMonth} className="form-control" onChange={e => setExpMonth(e.target.value)}>
                                    {monthList.map((op, i) => <option key={i}>0{op + 1}</option>)}
                                </select>
                            </div>
                            <div className="form-group col-md-6">
                                <label htmlFor="expYear">Expiry year</label>
                                <select id="expYear" value={expYear} className="form-control" onChange={e => setExpYear(e.target.value)}>
                                    <option>2021</option>
                                    <option>2022</option>
                                    <option>2023</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary">{!!isProcessing ? 'Processing...' : 'Pay'}</button>
                    </form>
                </div>
            </div>
        )
}

export default CyberSourceForm