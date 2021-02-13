import React, { Fragment, useState } from 'react'
import { prepareRequest } from '../../common/helpers'
import PopUp from '../Common/PopUp';
import WaitScreen from '../Common/WaitScreen';
import CheckEnrollment from './CheckEnrollment';

const PaymentToken = ({ token }) => {
    const [isProcessing, setIsProcessing] = useState(false)
    const [formResponse, setFormResponse] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsProcessing(true)

        const resp = await prepareRequest('POST', '/payer-auth-setup',
            JSON.stringify({ token }))
        if (!!resp && !!resp.success && !!resp.data) {
            setFormResponse(resp.data)
        } else {
            setFormResponse(false)
        }

        setIsProcessing(false)
    }

    if (!token)
        return <WaitScreen message={'Token Not Found'} />
    else
        return (
            <Fragment>
                {
                    !!formResponse && <PopUp closeOnEsc={true}
                        closePopUp={() => setFormResponse(false)}>
                        <CheckEnrollment info={formResponse} />
                    </PopUp>
                }
                <div className="container card">
                    <div className="card-body">
                        <h1>Token</h1>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th scope="col">Key</th>
                                    <th scope="col">value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr scope="row">
                                    <td>Customer Id</td>
                                    <td>{token}</td>
                                </tr>
                            </tbody>
                        </table>

                        <button type="button" id="pay-button" onClick={(e) => handleSubmit(e)}
                            className="btn btn-primary">{!!isProcessing ? 'Processing...' : 'Make a Payment'}</button>
                    </div>
                </div>
            </Fragment>
        )
}

export default PaymentToken