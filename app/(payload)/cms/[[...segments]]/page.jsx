import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import configPromise from '../../../../payload.config'
import { importMap } from '../importMap'

export const generateMetadata = async ({ params, searchParams }) => {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  return generatePageMetadata({ config: configPromise, params: resolvedParams, searchParams: resolvedSearchParams })
}

const Page = async ({ params, searchParams }) => {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  return RootPage({ config: configPromise, importMap, params: resolvedParams, searchParams: resolvedSearchParams })
}

export default Page
