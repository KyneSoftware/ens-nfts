import React from "react"
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import FiberNewIcon from '@material-ui/icons/FiberNew';
import ExploreIcon from '@material-ui/icons/Explore';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

import Layout from "../components/layout"
import SEO from "../components/seo"


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

/* Checks if this ENS name is valid by checking it's formatting, then putting it through name hash, then finally checking on chain whether the NFT exists in the 
ENS registry, in future, if the Name isn't in the registry but it's parent is, and this user's account is the owner of the parent name, I could register a subdomain on the fly.
*/
const handleEnsNameChange = (event) => {
  console.log('ENS input updated: ' + JSON.stringify(event.target.value))
  event.target.helperText = "Unknown ENS name"
  return "Unknown ENS Name"
}

/*
Performs namehash on the ENS input, and checks if it's present in the ENS registrar
*/
const handleLookupInputChange = (event) => {
  const ens = event.target.value;
  console.log('ENS search updated: ' + ens)
  
  const nameExists = checkIfEnsExists(ens)  
  console.log('Does this ENS name exist?: ' + nameExists.toString())
  return "Unknown ENS Name"
}

const checkIfEnsExists = (namehash) => {
  console.log('Checking if valid ENS namehash present in registrar: ' + JSON.stringify(namehash))
  return false
}

const handleLookupHelperText = (nameExists) => {
  console.log('Getting Helper text for this name: ' + JSON.stringify(nameExists))
  return "Input Helper Text"
}

export default function IndexPage() {
  const classes = useStyles();
  return (
    <Layout>
      <SEO title="Home" />
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <ExploreIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Search for a named NFT
          </Typography>
          <form className={classes.form} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  error={checkIfEnsExists}
                  onChange={handleLookupInputChange}
                  helperText={"handleLookupHelperText"}
                  name="ensName"
                  variant="outlined"
                  required
                  fullWidth
                  id="ensName"
                  label="ENS Name"
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
            >
              Lookup NFT
          </Button>
          </form>
          <Avatar className={classes.avatar}>
            <FiberNewIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Name an NFT with ENS
          </Typography>
          <form className={classes.form} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  error={true}
                  onChange={handleEnsNameChange}
                  name="ensName"
                  variant="outlined"
                  required
                  fullWidth
                  id="ensName"
                  label="ENS Name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="contractAddress"
                  label="NFT Contract Address"
                  name="contractAddress"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="tokenId"
                  label="Token ID"
                  name="tokenId"
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
            >
              Set Name
          </Button>
            <Grid container justify="flex-end">
              <Grid item>
                <Link href="#" variant="body2">
                  Bug report? Click Here
                </Link>
              </Grid>
            </Grid>
          </form>
        </div>
      </Container>
    </Layout>
  )
}

