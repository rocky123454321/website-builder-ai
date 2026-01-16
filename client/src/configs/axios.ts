import axios from 'axios'

// Use Vite proxy in development, relative URLs in production (same domain)
const baseURL = import.meta.env.PROD ? '' : ''
console.log('Axios baseURL:', baseURL || 'relative URLs')

const api = axios.create({
    baseURL,
   withCredentials: true
})


export default api
