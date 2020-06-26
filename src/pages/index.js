import React from "react"
import CssBaseline from '@material-ui/core/CssBaseline';

import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

import Layout from "../components/layout"
import SEO from "../components/seo"
import SearchEns from "../components/searchEnsNft"
import SetEnsToNft from "../components/setEnsNft";


const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: 'rebeccapurple',
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));



export default function IndexPage() {
  const classes = useStyles();
  return (
    <Layout>
      <SEO title="Home" />
      <Container component="main" maxWidth="xs">
        <CssBaseline />
          <SearchEns />
          <SetEnsToNft />
      </Container>
    </Layout>
  )
}

