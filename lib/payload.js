import { getPayload } from 'payload'
import configPromise from '../payload.config'

/**
 * Fetch page content (texts, media, sections) from Payload CMS by pageIdentifier.
 * Returns null if not found or if database is not reachable.
 */
export async function getPageContent(pageIdentifier) {
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'page-content',
      where: {
        pageIdentifier: {
          equals: pageIdentifier,
        },
      },
      limit: 1,
    })

    if (res.docs && res.docs.length > 0) {
      return res.docs[0]
    }
  } catch (error) {
    console.warn(`[Payload CMS] Could not fetch content for page: ${pageIdentifier}`, error?.message || error)
  }
  return null
}

/**
 * Fetch Header & Footer global navigation content.
 */
export async function getNavigation() {
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.findGlobal({
      slug: 'navigation',
    })
    return res
  } catch (error) {
    console.warn('[Payload CMS] Could not fetch navigation global:', error?.message || error)
  }
  return null
}
