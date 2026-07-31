import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import configPromise from '../../../payload.config'
import { importMap } from './importMap'
import '@payloadcms/next/css'
import React from 'react'

export const metadata = {
  title: 'Yaadein CMS Admin Panel',
  description: 'Manage content and media for Yaadein',
}

const serverFunction = async (args) => {
  'use server'
  return handleServerFunctions({
    ...args,
    config: configPromise,
    importMap,
  })
}

const Layout = ({ children }) => (
  <RootLayout config={configPromise} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
