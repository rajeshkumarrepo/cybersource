import React, { Fragment, useEffect } from 'react'
import styled from 'styled-components'

const Container = styled.div`
`;

const SetupForm = ({ info: { jwt, stepup_url, data, error } }) => {
    useEffect(() => {
        const stepUpForm = document.querySelector('#step-up-form')
        !!stepUpForm && stepUpForm.submit()
    }, [])

    return (
        <Container>
            {!!stepup_url ? <Fragment>
                <iframe name="step-up-iframe" width="400" />
                <form id="step-up-form" target="step-up-iframe" method="post" action={stepup_url}>
                    <input type="hidden" name="JWT" value={jwt} />
                </form>
            </Fragment> : <div class="card-body">
                    <h1>Result</h1>
                    <p className="green">{!!data ? data : 'N/A'}</p>
                    <h1>Error</h1>
                    <p className="red">{!!error ? error : 'N/A'}</p>
                </div>
            }
        </Container >
    )
}

export default SetupForm