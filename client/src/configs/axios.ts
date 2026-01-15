import axios from 'axios'

// Use Vite proxy in development, direct URL in production
const baseURL = import.meta.env.PROD ? (import.meta.env.VITE_BASEURL || 'http://localhost:3000') : ''
console.log('Axios baseURL:', baseURL || 'using Vite proxy')

const api = axios.create({
    baseURL,
   withCredentials: true
})


export default api
