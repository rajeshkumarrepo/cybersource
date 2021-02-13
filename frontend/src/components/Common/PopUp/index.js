import React, { useEffect, useRef } from 'react'
import close from './Close.svg'
import './index.scss'

const PopUp = ({
    closePopUp, fColumn = false,
    closeOnEsc = false, closeOnOutClick = false, children
}) => {
    const winWrapper = useRef()

    const handleClickOutside = event => {
        if (!!winWrapper &&
            !!closeOnOutClick &&
            (winWrapper.current !== null) &&
            !winWrapper.current.contains(event.target)) {
            closePopUp()
        }
    }

    const handleKeyDown = e => {
        if (((e.keyCode === 27) ||
            (e.key === "Escape") ||
            (e.key === "Esc")) && !!closeOnEsc) {
            closePopUp()
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    return (
        <section className='eargo-cybersource-layout-container'>
            <div className='eargo-cybersource-layout-wrapper' ref={winWrapper}>
                <div className='eargo-cybersource-layout-form-container'>
                    <div className='eargo-cybersource-layout-close' onClick={() => closePopUp()}>
                        <img src={close} alt="Close" />
                    </div>
                    <div className={`eargo-cybersource-layout-form-holder ${fColumn ? 'f-column' : ''}`}>
                        {children}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default PopUp