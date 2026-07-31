import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import configPromise from '../../../../payload.config'
import { importMap } from '../importMap'

export const generateMetadata = ({ params, searchParams }) =>
  generatePageMetadata({ config: configPromise, params, searchParams })

const Page = ({ params, searchParams }) =>
  RootPage({ config: configPromise, importMap, params, searchParams })

export default Page
