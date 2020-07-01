import React from "react"
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { SnackbarProvider } from 'notistack';

import Layout from "../components/layout"
import SEO from "../components/seo"
import SearchEns from "../components/searchEnsNft"
import SetEnsToNft from "../components/setEnsNft";

// For setting up Web3 react provider
function getWeb3Library(provider) {
  return new Web3Provider(provider)
}

export default function IndexPage() {
  return (
    <Web3ReactProvider getLibrary={getWeb3Library}>
      <SnackbarProvider maxSnack={3}>
        <Layout>
          <SEO title="Home" />
          <Container component="main" maxWidth="xs">
            <CssBaseline />
            <SearchEns />
            <SetEnsToNft />
          </Container>
        </Layout>
      </SnackbarProvider>
    </Web3ReactProvider>
  )
}

