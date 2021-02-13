import React from 'react'
import styled from 'styled-components'

const Container = styled.div`
position: fixed;
top: 0;
bottom: 0;
display: flex;
justify-content: center;
align-items: center;
width: 100%;
height: 100%;
left: 0;
`;

const Message = styled.div`
font-size: 25px;
font-weight: 800;
`;


const WaitScreen = ({ message = 'Processing...' }) => (
    <Container>
        {!!message && <Message>{message}</Message>}
    </Container>
)

export default WaitScreen