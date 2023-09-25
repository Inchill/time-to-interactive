import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { onTTI } from '../../dist/index.esm';

onTTI((res: any) => console.log(res))

createApp(App).mount('#app')
