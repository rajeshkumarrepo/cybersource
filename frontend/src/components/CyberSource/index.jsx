import React, { useEffect, useState } from 'react'
import CyberSourceForm from './Form'
import { prepareRequest } from '../../common/helpers'
import WaitScreen from '../Common/WaitScreen'

const CyberSource = () => {
    const [initialize, setInitialize] = useState(false)
    const [keyInfo, setKeyInfo] = useState(false)

    useEffect(() => {
        const fetchKeyInfo = async () => {
            try {
                const resp = await prepareRequest('GET', '/checkout')
                if (!!resp && !!resp.success && !!resp.data && !!resp.data.keyInfo) {
                    setKeyInfo(resp.data.keyInfo)
                }
            } catch (e) {
                console.log("fetchKeyInfo Error: ", e)
            }
            setInitialize(true)
        }
        !initialize && fetchKeyInfo()
    }, [])

    if (!initialize || !keyInfo)
        return <WaitScreen message={!initialize ?
            'Initializing...' :
            'Something went wrong, Please try after some time.'} />

    return <CyberSourceForm captureContext={keyInfo} />
}

export default CyberSource