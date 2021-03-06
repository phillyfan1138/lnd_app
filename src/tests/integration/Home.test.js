import React from 'react'
import 'index.css'
import { 
    SET_ENCRYPTED_MACAROON,
    SET_SHOW_RAW, 
    SET_SHOW_RAW_MACAROON, CONNECT_UNLOCKED, 
    ENTER_PAYMENT_REQUEST
} from 'Actions/actionDefinitions'
import Home from 'views/Home'
import { setQRRawMacaroon} from 'Actions/qrActions'
import {updateSignIn} from 'Actions/signInActions'
import { Provider } from 'react-redux'
import {  mount } from 'enzyme'
import { createStore } from 'redux'
import reducer from 'Reducers/reducers'
import 'typeface-roboto'
import 'assets/css/material-dashboard-react.css'
import SignIn from 'views/SignIn'
import InputLabel from "@material-ui/core/InputLabel"
import Button from 'components/CustomButtons/Button'
import {ConnectButton, LndButton} from 'views/ConnectButton'
import Snackbar from 'components/Snackbar/Snackbar'
import {QRInputMacaroon} from 'components/Utils/QRInput'
import Input from "@material-ui/core/Input"
import {
    MemoryRouter as Router,
    Route
} from 'react-router-dom'
import {delay} from 'utils/componentUtils'
import {  ToggleQRButtonMacaroon } from '../../components/Utils/QRInput'
jest.mock('react-qr-scanner', ()=>()=><div id='video'></div>)
let store
const textContent = node => {
    try {
      // enzyme sometimes blows up on text()
      return node.text();
    } catch (_e) {
      return '';
    }
}
beforeEach(() => {
    fetch.resetMocks()
    store = createStore(reducer)
    store.dispatch({
        type:SET_SHOW_RAW,
        value:true
    })
    store.dispatch({
        type:SET_SHOW_RAW_MACAROON,
        value:true
    })
})
describe('render', ()=>{
    it('renders without error', ()=>{
        mount(
            <Provider store={store}>
                <Router>
                    <Route path='/' component={Home}/>
                </Router>
            </Provider>
        )
    })
})
describe('integrations', ()=>{
    it('correctly renders settings on start', ()=>{
        const app=mount(
            <Provider store={store}>
                <Router>
                    <Route path='/' component={Home}/>
                </Router>
            </Provider>
        )
        expect(app.find(SignIn).length).toEqual(1)
    })
    it('correctly provides warning when not connected and in transactions', ()=>{
        //console.log(store.getState())
        const app=mount(
            <Provider store={store}>
                <Router initialEntries={[ '/transactions' ]}>
                    <Route path='/' component={Home}/>
                </Router>
            </Provider>
        )
        app.update()
        expect(app.find('p').findWhere(
            v=>textContent(v)==='Not connected to the Lightning Network!  Go to settings to connect to update connection settings.'
        ).length).toBeGreaterThan(0)
    })
    it('correctly provides warning when not connected and in invoices', ()=>{
        const app=mount(
            <Provider store={store}>
                <Router initialEntries={[ '/invoices' ]}>
                    <Route path='/' component={Home}/>
                </Router>
            </Provider>
        )
        app.update()
        expect(app.find('p').findWhere(
            v=>textContent(v)==='Not connected to the Lightning Network!  Go to settings to connect to update connection settings.'
        ).length).toBeGreaterThan(0)
    })
    it('correctly provides warning when not connected and in payments', ()=>{
        const app=mount(
            <Provider store={store}>
                <Router initialEntries={[ '/payments' ]}>
                    <Route path='/' component={Home}/>
                </Router>
            </Provider>
        )
        app.update()
        expect(app.find('p').findWhere(
            v=>textContent(v)==='Not connected to the Lightning Network!  Go to settings to connect to update connection settings.'
        ).length).toBeGreaterThan(0)
    })
    it('correctly requests macaroon and password if macaroon is not in localstorage', ()=>{
        
        const app=mount(
            <Provider store={store}>
                <Router>
                    <Route path='/' component={Home}/>
                </Router>
            </Provider>
        )
        
        app.update()
        const macaroons=app.findWhere(val=>textContent(val)==='Macaroon').find(InputLabel)
        expect(macaroons.length).toEqual(1)
        const password=app.findWhere(val=>textContent(val)==='Password').find(InputLabel)
        expect(password.length).toEqual(1)

    })
    it('correctly requests only password if macaroon is in localstorage', ()=>{
        const app=mount(
            <Provider store={store}>
                <Router>
                    <Route path='/' component={Home}/>
                </Router>
            </Provider>
        )
        store.dispatch({
            type:SET_ENCRYPTED_MACAROON,
            value:'something'
        })
        app.update()
        const macaroons=app.findWhere(val=>textContent(val)==='Macaroon').find(InputLabel)
        expect(macaroons.length).toEqual(0)
        const removeMacaroon=app.findWhere(val=>textContent(val)==='Remove existing encrypted macaroon').find(Button)
        expect(removeMacaroon.length).toEqual(1)
        const password=app.findWhere(val=>textContent(val)==='Password').find(InputLabel)
        expect(password.length).toEqual(1)

    })
    it('correctly removes existing and allows for typing new macaroon when macaroon starts in localstorage', ()=>{
        const app=mount(
            <Provider store={store}>
                <Router>
                    <Route path='/' component={Home}/>
                </Router>
            </Provider>
        )
        store.dispatch({
            type:SET_ENCRYPTED_MACAROON,
            value:'something'
        })
        app.update()

        const macaroons=app.findWhere(val=>textContent(val)==='Macaroon').find(InputLabel)
        expect(macaroons.length).toEqual(0)
        const removeMacaroon=app.findWhere(val=>textContent(val)==='Remove existing encrypted macaroon').find(Button)
        removeMacaroon.props().onClick()
        app.update()
        
        
        const macaroons2=app.findWhere(val=>textContent(val)==='Macaroon').find(InputLabel)
        expect(macaroons2.length).toEqual(1)
        const password=app.findWhere(val=>textContent(val)==='Password').find(InputLabel)
        expect(password.length).toEqual(1)

    })
    it('correctly shows errors when password and macaroon are entered but does not connect', ()=>{
        fetch.mockReject(new Error('error happened'))
        //fetch.mockResponse(JSON.stringify("fail"), { status: 401, ok: false })
        //fetch.mockReject(()=>Promise.reject('error happened'))
        const app=mount(
            <Provider store={store}>
                <Router>
                    <Route path='/' component={Home}/>
                </Router>
            </Provider>
        )
        app.update()       
        
        const toggleQR=app.find(ToggleQRButtonMacaroon)
        expect(toggleQR.text()).toEqual('Scan QR')


        /**Simulate input to macaroon */
        const macaroonsInput=app.findWhere(val=>textContent(val)==='Macaroon').find(Input)
        expect(macaroonsInput.length).toEqual(1)
        macaroonsInput.props().onChange({target:{value:'hello'}})

        /**Simulate input to password */
        const passwordInput=app.findWhere(val=>textContent(val)==='Password').find(Input)
        expect(passwordInput.length).toEqual(1)
        passwordInput.props().onChange({target:{value:'password'}})
        app.update() 
        /**simulate hostname */
        const hostnameInput=app.findWhere(val=>textContent(val)==='Lightning Host Name').find(Input)
        expect(hostnameInput.length).toEqual(1)
        hostnameInput.props().onChange({target:{value:'host'}})
        app.update() 
        /**Simulate click of button */
        const conButton=app.find(ConnectButton).find(Button)
        expect(conButton.text()).toEqual('Save and Connect')
        conButton.props().onClick()

        app.update() 
        expect(fetch.mock.calls.length).toEqual(2)

        return delay(50)
            .then(()=>app.update())
            .then(()=>expect(app.find(Snackbar).props().color).toEqual('danger'))
            .then(()=>expect(app.find(Snackbar).props().message).toEqual('error happened'))
            .then(()=>expect(app.find(Snackbar).props().open).toEqual(true))  
    })
    it('correctly shows warnings when password and macaroon are entered but does not connect due to locked', ()=>{
        fetch.mockResponses(['Not Found '], ['Not Found ']) //both results are not found
        const app=mount(
            <Provider store={store}>
                <Router>
                    <Route path='/' component={Home}/>
                </Router>
            </Provider>
        )
        app.update()       

        const toggleQR=app.find(ToggleQRButtonMacaroon)
        expect(toggleQR.text()).toEqual('Scan QR')

        //console.log(app.html())
        /**Simulate input to macaroon */
        const macaroonsInput=app.findWhere(val=>textContent(val)==='Macaroon').find(Input)
        expect(macaroonsInput.length).toEqual(1)
        macaroonsInput.props().onChange({target:{value:'hello'}})

        /**Simulate input to password */
        const passwordInput=app.findWhere(val=>textContent(val)==='Password').find(Input)
        expect(passwordInput.length).toEqual(1)
        passwordInput.props().onChange({target:{value:'password'}})
        app.update() 
        /**simulate hostname */
        const hostnameInput=app.findWhere(val=>textContent(val)==='Lightning Host Name').find(Input)
        expect(hostnameInput.length).toEqual(1)
        hostnameInput.props().onChange({target:{value:'host'}})
        app.update() 
        /**Simulate click of button */
        const conButton=app.find(ConnectButton).find(Button)
        expect(conButton.text()).toEqual('Save and Connect')
        conButton.props().onClick()

        app.update() 
        expect(fetch.mock.calls.length).toEqual(2)

        return delay(50)
            .then(()=>app.update())
            .then(()=>expect(app.find(Snackbar).props().color).toEqual('warning'))
            .then(()=>expect(app.find(Snackbar).props().message).toEqual('Connection succeeded, but wallet is locked'))
           .then(()=>expect(app.find(Snackbar).props().open).toEqual(true))  
    })


    it('correctly closes qr when receives input', ()=>{
        store.dispatch({
            type:SET_SHOW_RAW_MACAROON,
            value:false
        })
        const app=mount(
            <Provider store={store}>
                <Router>
                    <Route path='/' component={Home}/>
                </Router>
            </Provider>
        )
        
        app.update()

        const video=app.find('#video')
        expect(video.length).toEqual(1)
        const qrInput=app.find(QRInputMacaroon)
        expect(qrInput.length).toEqual(1)

        updateSignIn(store.dispatch)('macaroon')('hello')
        setQRRawMacaroon(store.dispatch)(false)()

        app.update()
        const newVideo=app.find('#video')
        expect(newVideo.length).toEqual(0)

    })
    it('has submit button enabled when value exists for payment', ()=>{
        store.dispatch({
            type:CONNECT_UNLOCKED
        })
        const app=mount(
            <Provider store={store}>
                <Router initialEntries={[ '/payments' ]}>
                    <Route path='/' component={Home}/>
                </Router>
            </Provider>
        )
        
        const input1=app.findWhere(val=>textContent(val)==='Payment Request').find(Input)
        
        expect(input1.text()).toEqual('')
        const button1=app.find(LndButton)
        expect(button1.props().style.disabled).toEqual(true)

        store.dispatch({
            type:ENTER_PAYMENT_REQUEST,
            value:'hello'
        })

        app.update()

        const input2=app.find(Input).find('textarea').findWhere(val=>!val.props()['aria-hidden'])
        expect(input2.length).toEqual(1)
        //console.log(input2.html())
        expect(input2.text()).toEqual('hello')

        const button2=app.find(LndButton)
        
        expect(button2.props().style.disabled).toEqual(false)

    })


})