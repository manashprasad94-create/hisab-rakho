importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:"AIzaSyCkJ7MpU6MOsiWO4onu1TkDSRTqY73hOeg",
  authDomain: "hisab-kitab99.firebaseapp.com",
  projectId: "hisab-kitab99",
  storageBucket: "hisab-kitab99.firebasestorage.app",
  messagingSenderId: "239004135439",
  appId: "1:239004135439:web:44b680715b4195caceb37a",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {}
  self.registration.showNotification(title || 'Hisab Kitab', {
    body: body || '',
    icon: '/icon-192.png',
  })
})