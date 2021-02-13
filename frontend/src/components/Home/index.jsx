import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../../logo.svg'

const Home = () => (
    <div className="App">
        <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <Link
                className="App-link"
                to="/cybersource"
            >
                CyberSource
        </Link>
        </header>
    </div>
)

export default Home