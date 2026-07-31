import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { Media } from './payload/collections/Media.js'
import { Pages } from './payload/collections/Pages.js'
import { ServicesCollection } from './payload/collections/Services.js'
import { Navigation } from './payload/globals/Navigation.js'
import { HomePage } from './payload/globals/HomePage.js'
import { CatalogPage } from './payload/globals/CatalogPage.js'
import { ServicesPage } from './payload/globals/ServicesPage.js'
import { TrackPage } from './payload/globals/TrackPage.js'
import { ContactPage } from './payload/globals/ContactPage.js'
import { PrivacyPolicyPage } from './payload/globals/PrivacyPolicyPage.js'
import { RefundPolicyPage } from './payload/globals/RefundPolicyPage.js'
import { TermsPage } from './payload/globals/TermsPage.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` :
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''))

export default buildConfig({
  serverURL,
  routes: {
    admin: '/cms',
  },
  admin: {
    user: 'users',
  },
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
    Media,
    ServicesCollection,
    Pages,
  ],
  globals: [
    HomePage,
    CatalogPage,
    ServicesPage,
    TrackPage,
    ContactPage,
    PrivacyPolicyPage,
    RefundPolicyPage,
    TermsPage,
    Navigation,
  ],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || 'yaadein_payload_secret_key_2026_super_secure',
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || process.env.MONGODB_URI || 'mongodb+srv://yaadeinpkdb_db_user:qk8TYiHFkXKqZ6Mq@cluster0.kjgsuvu.mongodb.net/yaadein?appName=Cluster0',
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
