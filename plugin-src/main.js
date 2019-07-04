import 'chrome-extension-async';
import { App } from './app.js';
import React from 'react';
import ReactDOM from 'react-dom';
import './style.css';

// yo im gonna start a connection to the background
ReactDOM.render(<App />, document.getElementById('root'));
