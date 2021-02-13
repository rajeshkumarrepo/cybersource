import React, { Fragment, useEffect, useState } from 'react'
import { prepareRequest } from '../../common/helpers'
import WaitScreen from '../Common/WaitScreen'
import SetupForm from './SetupForm'

const CheckEnrollment = ({ info: {
    jti, reference_id, return_url, url, token, accesstoken
} }) => {
    const [isProcessing, setIsPorocessing] = useState(false)
    const [validatedResp, setValidatedResp] = useState(false)

    const submitForm = (event) => {
        const checkEnrollmentAPI = async () => {
            const resp = await prepareRequest('POST', '/check-enrollment',
                JSON.stringify({
                    jti, reference_id, return_url, token
                }))
            if (!!resp && !!resp.success && !!resp.data)
                setValidatedResp(resp.data)
            else
                setValidatedResp(false)
        }

        setIsPorocessing(true)

        let data = JSON.parse(event.data);
        if (event.origin === "https://centinelapistag.cardinalcommerce.com") {
            console.log('Merchant received a message:', data);
        }
        if (data !== undefined && data.Status) {
            console.log('Songbird ran DF successfully');
        }
        checkEnrollmentAPI()
        setIsPorocessing(false)
    }

    useEffect(() => {
        const ddcForm = document.querySelector('#ddc-form')
        !!ddcForm && ddcForm.submit()

        window.addEventListener('message', submitForm)
        return () => {
            window.removeEventListener('message', submitForm)
        }
    }, [])


    if (!!validatedResp) return <SetupForm info={validatedResp} />
    return (
        <Fragment>
            {!!isProcessing && <WaitScreen message={'Processing...'} />}
            <iframe name="ddc-iframe" height={1} width={1} style={{ display: 'none' }} />
            <form id="ddc-form" target="ddc-iframe" method="POST" action={url}>
                <input type="hidden" name="JWT" value={accesstoken} />
            </form>
        </Fragment>
    )
}

export default CheckEnrollment