/**
 * Search ENS NFT component that queries connected Ethereum service for an existing NFT pointed to by this name
 */

import React, { useState } from "react"
import { Grid, TextField, Button, makeStyles, Avatar, Typography } from "@material-ui/core"
import ExploreIcon from '@material-ui/icons/Explore';
import namehash from 'eth-ens-namehash'
import { useWeb3React } from '@web3-react/core'
import { useSnackbar, closeSnackbar } from 'notistack';

import { useEagerConnect, useInactiveListener } from '../hooks/web3'

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(2),
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
    backgroundColor: 'rebeccapurple',
  },
}));



export default function SearchEns() {
  const [searchValue, setSearchValue] = useState('')
  const [helperText, setHelperText] = useState('Search for an NFT by name')
  const [validEnsName, setValidEnsName] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  // Snackbar warnings
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // Web3 connection
  const context = useWeb3React()
  const { connector, library, chainId, account, activate, deactivate, active, error } = context

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = React.useState()
  React.useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined)
    }
  }, [activatingConnector, connector])

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  const triedEager = useEagerConnect()

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector)

  console.log('Web3 instansiated!')
  console.log(context)
  console.log(active)

  // When a name is typed into the search box
  const onChange = event => {
    setSearchValue(event.target.value)
    setValidEnsName(true)
    console.log('Searching for : ' + searchValue)
    const hash = namehash.hash(searchValue)
    // setHelperText('Searching for ENS: ' + hash)

  }

  /* 
    When search is clicked.
    Check:
    - web3 injected
    - not connecting
    - account active

    Then:
    - Lookup ENS registry contract
    - Check if the namehash of this name is present (making sure not to get disrupted by the fallback to the old registry)
    - See if that ens record has a resolver contract set
    - See if the resolver responds to an ERC165 in the manner to suggest it supports EIP2381 (0x4b23de55)
    - If yes: Query the resolvers tokenId() function 
    - If yes: See if that resolver contract has an address set
    - If yes: See if that address responds to an ERC165 in the manner to suggest it is an ERC721 contract

  */
  const onSubmit = event => {
    event.preventDefault();
    setIsLoading(true)
    setValidEnsName(true)
    setHelperText('Searching')
    console.log('Searching for ENS NFT: ' + searchValue) 
  

    // Web3 injected
    if(connector === undefined){
      enqueueSnackbar('Please use a metamask enabled browser', {
      variant: 'error',
    })
    setHelperText('Injected Web3 wallet not found')
    setIsLoading(false)
    return
    }
    // Web3 unlocked
    else if(connector !== undefined && !active){
      console.warn('Web3 injected but not enabled.')
      enqueueSnackbar('Please unlock your metamask', {
      variant: 'warning',
    })
    setHelperText('Wallet not unlocked')
    setIsLoading(false)
    return
    }
    // Web3 unlocked
    else if(connector !== undefined && activatingConnector){
      console.warn('Web3 injected but not enabled.')
      enqueueSnackbar('Please unlock your metamask', {
      variant: 'warning',
    })
    setHelperText('Wallet not unlocked')
    setIsLoading(false)
    return
    }

    enqueueSnackbar('Searching', {
      variant: 'default',
    })

    setTimeout(() => {
      setValidEnsName(false)
      setIsLoading(false)
      setHelperText('NFT not found')
      closeSnackbar()

    }, 1000)
  }

  const classes = useStyles();
  return (
    <div className={classes.paper}>
      <Avatar className={classes.avatar}>
        <ExploreIcon />
      </Avatar>
      <Typography component="h1" variant="h5">
        Search for a named NFT
      </Typography>
      <form className={classes.form} noValidate onSubmit={onSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              onChange={onChange}
              helperText={helperText}
              error={!validEnsName}
              disabled={isLoading}
              name="ensName"
              variant="outlined"
              required
              fullWidth
              id="ensName"
              value={searchValue}
              label="ENS Name"
            // InputLabelProps={{
            //   shrink: true,
            // }}
            />
          </Grid>
        </Grid>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          className={classes.submit}
          disabled={isLoading}
        >
          Lookup NFT
      </Button>
      </form>
    </div>
  )
}

