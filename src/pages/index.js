import React from "react"
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { SnackbarProvider } from 'notistack';

import Layout from "../components/layout"
import SEO from "../components/seo"
import MetamaskOnboarding from "../components/metamaskOnboarding";
import SearchEns from "../components/searchEnsNft"
import SetEnsToNft from "../components/setEnsNft";
import { Typography, Link, ThemeProvider, createMuiTheme } from "@material-ui/core";
import { green, red, yellow } from "@material-ui/core/colors";


// For setting up Web3 react provider
function getWeb3Library(provider) {
  return new Web3Provider(provider)
}

// Website theme
const theme = createMuiTheme({
  palette: {
    primary: {
      main: `#000000`,
    },
    secondary: {
      main: `#f6c26c`,
    },
    info: {
      main: `#449DD1`
    },
    success: {
      main: green[500]
    },
    error: {
      main: red[500]
    },
    warning: {
      main: yellow[500]
    }
  },
});

export default function IndexPage() {
  return (
    <Web3ReactProvider getLibrary={getWeb3Library}>
      <SnackbarProvider maxSnack={3}>
      <ThemeProvider theme={theme}>
        <Layout>
          <SEO title="Name your NFTs with ENS" />
          <Container component="main" maxWidth="xs">
            <CssBaseline />
            <Typography component="h1" variant="h5" align={"center"} gutterBottom>
              What is this site?
            </Typography>
            <Typography gutterBottom>
              Ethereum and the Ethereum Name Service go hand in hand like the Internet and DNS. ENS has been used to address people, contracts, cryptokitties and more. However, until recently, it hasn't been possible to assign an ENS name to a specific NFT. This is becoming a problem as more and more fradulent copycat NFTs are being minted and wash-traded with the intention of being sold to unsuspecting investors. It is important that NFT issuers can signal the authenticity of an NFT on chain. The best way to do that in my mind is using an ENS subdomain controlled by the issuer.
            </Typography>
            <Typography gutterBottom>
              My ENS name is <code>oisin.eth</code>, and when I went to Devcon last year, I bought an NFT ticket by auction on Ethereum. I wanted to set an ENS subdomain name to point at it, but I realised it wasn't possible, so I made an <Link href="https://github.com/ethereum/EIPs/pull/2381" target="_blank" rel="noreferrer">EIP</Link> to fix it.
            </Typography>
            <Typography gutterBottom>
              If you have Metamask installed and connected, look it up by it's ENS name in the search box below: <code>devcon5.oisin.eth</code>. 
            </Typography>
            <MetamaskOnboarding />
            <SearchEns />
            <SetEnsToNft />
          </Container>
        </Layout>
        </ThemeProvider>
      </SnackbarProvider>
    </Web3ReactProvider>
  )
}

