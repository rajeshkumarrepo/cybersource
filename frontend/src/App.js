import React from 'react'
import { Switch, Route } from 'react-router-dom'
import Home from './components/Home'
import CyberSource from './components/CyberSource'
import './App.css'

const App = () => (
  <Switch>
    <Route exact path='/' component={Home} />
    <Route exact path='/cybersource' component={CyberSource} />
  </Switch>
)

export default App