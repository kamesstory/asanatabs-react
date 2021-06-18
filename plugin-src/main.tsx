/** @jsx jsx */
import 'chrome-extension-async';
import { App } from './App';
import { jsx } from '@emotion/core';
import ReactDOM from 'react-dom';
import './style.css';

// let me: any;
// me = await Asana.me();
// chrome.storage.local.set({ [Asana.ME_INFO]: me });
// chrome.storage.local.clear();

ReactDOM.render(<App />, document.getElementById('root'));
