import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(handleShareTarget(event))
  }
})

async function handleShareTarget(event) {
  const formData = await event.request.formData()
  const file = formData.get('photo')

  if (file) {
    const cache = await caches.open('share-target-cache')
    await cache.put('/shared-receipt', new Response(file))
  }

  return Response.redirect('/share-target?shared=1', 303)
}