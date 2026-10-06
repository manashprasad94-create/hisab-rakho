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

  if (file instanceof File && file.size <= 5_000_000 &&
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    const cache = await caches.open('share-target-cache')
    const id = crypto.randomUUID()
    const now = Date.now()
    for (const request of await cache.keys()) {
      const cached = await cache.match(request)
      if (now - Number(cached?.headers.get('X-Saved-At') || 0) > 60 * 60 * 1000) {
        await cache.delete(request)
      }
    }
    await cache.put(`/shared-receipt/${id}`, new Response(file, {
      headers: { 'Content-Type': file.type, 'X-Saved-At': String(now) },
    }))
    return Response.redirect(`/share-target?shared=1&id=${id}`, 303)
  }

  return Response.redirect('/add-expense', 303)
}
