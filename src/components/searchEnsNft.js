/**
 * Search ENS NFT component that queries connected Ethereum service for an existing NFT pointed to by this name
 */

import React, { useState } from "react"
import { Grid, TextField, Button, makeStyles, Avatar, Typography, CircularProgress } from "@material-ui/core"
import ExploreIcon from '@material-ui/icons/Explore';
import namehash from 'eth-ens-namehash'
import { useWeb3React } from '@web3-react/core'
import { useSnackbar, closeSnackbar } from 'notistack';

import { useEagerConnect, useInactiveListener } from '../hooks/web3'
import { nameExists, getAddr, getResolver, resolverSet, checkSupportsInterface, getTokenId } from '../services/ens'

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

// Text for helpers and snackbars
const SEARCH_FOR_NFT_TEXT = 'Search for an NFT by name';
const SEARCHING_TEXT = 'Searching';
const NOT_FOUND_TEXT = 'NFT not found';
const FOUND_TEXT = 'NFT found';
const FOUND_NOT_NFT_TEXT = 'This name does not point to an NFT contract'
const ERROR_TEXT = 'There was a problem searching for this NFT';
const ENS_FORMAT_INCORRECT_TEXT = 'Not a recognised ENS name format';
const ENS_FORMAT_INVALID_TEXT = 'Cannot parse input as an ENS name';

export default function SearchEns() {
  // The value typed into the input textfield
  const [searchValue, setSearchValue] = useState('')
  // The object containing the details of an NFT (address, tokenId, owner) if found after a search
  const [nftFound, setNftFound] = useState(false)
  // The details about the NFT searched for
  const [nftData, setNftData] = useState({ 'address': null, 'tokenId': null, 'owner': null })
  const [helperText, setHelperText] = useState(SEARCH_FOR_NFT_TEXT)
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


  // When a name is typed into the search box
  const onChange = event => {
    const search = event.target.value
    setSearchValue(search)

    // Normalise the input
    var normalized;
    try {
      normalized = namehash.normalize(search)
    } catch {
      setValidEnsName(false)
      setHelperText(ENS_FORMAT_INVALID_TEXT)
      return
    }

    // Should be .eth for now, even though there can be other TLDs (Technically .test is valid on Ropsten but will have to fix that next)
    const tail = normalized.substr(normalized.length - 4)
    // console.log(`Normalised version of input: ${search} is ${normalized}. The last 4 chars are: ${tail}`)

    if (search === normalized && tail === '.eth') {
      setValidEnsName(true)
      setHelperText(SEARCH_FOR_NFT_TEXT)
    } else {
      setValidEnsName(false)
      setHelperText(ENS_FORMAT_INCORRECT_TEXT)
    }
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
    setNftFound(false)
    setNftData({ 'address': null, 'tokenId': null, 'owner': null, 'nameOwner': null })
    setValidEnsName(true)
    setHelperText(SEARCHING_TEXT)
    console.log('Searching for ENS NFT: ' + searchValue)

    // Web3 injected
    if (connector === undefined) {
      enqueueSnackbar('Please use a metamask enabled browser', {
        variant: 'error',
      })
      setHelperText(ERROR_TEXT)
      setIsLoading(false)
      return
    }
    // Web3 unlocked
    else if (connector !== undefined && !active) {
      console.warn('Web3 injected but not enabled.')
      enqueueSnackbar('Please unlock your metamask', {
        variant: 'warning',
      })
      setHelperText('Wallet not unlocked')
      setIsLoading(false)
      return
    }
    // Web3 unlocked
    else if (connector !== undefined && activatingConnector) {
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


    // Check if this name exists in the registry
    nameExists(searchValue)
    getAddr(searchValue).then(addr => {
      // Address of this name. 
      console.log(`We have found a contract address for this name: ${searchValue.toString()}: ${addr.toString()}`)
      setNftData({ ...nftData, 'address': addr.toString() })
      setValidEnsName(true)

      // Check this contract is an ERC721
      checkSupportsInterface(addr, '0x80ac58cd').then((supported) => {
        setNftFound(true)
        setHelperText(FOUND_TEXT)
      }).catch(err =>
        {
          setNftFound(false)
          setHelperText(FOUND_NOT_NFT_TEXT)
        })
    }).catch((err)=>{
      setNftFound(false)
      setHelperText(NOT_FOUND_TEXT)
    })

    // Check if ENS resolver is set
    getResolver(searchValue).then((resolver) => {
      // Check if this resolver uses ERC2381
      checkSupportsInterface(resolver, '0x4b23de55').then((supportsInterface) => {
        getTokenId(searchValue, resolver).then((token) => {
          console.log(`ENS name: ${searchValue}, Associated tokenId: ${token}`)
          if (!!token) {
            // We have returned a non zero tokenID from this resolver contract, set it in state.
            console.log(`We have an ENS token. Adding to state: ${token}`)
            setNftData({ ...nftData, tokenId: token.toString() })
          }
          else {
            console.log(`tokenID not set. `)
          }
        })
      })
    })


    setTimeout(() => {

      setIsLoading(false)

      closeSnackbar()
      console.log(nftData)

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
      <Grid container alignItems="center" direction="column" spacing={2}>
        {
          isLoading && (
            <Grid item xs={12} >
              <CircularProgress color="primary" />
            </Grid>
          )
        }
        {
          nftFound && (
            <Grid item xs={12} >
              <Typography>Contract Address:{" "}
                {
                  nftData.address
                }
              </Typography>
              <Typography>Token ID:{" "}
                {
                  nftData.tokenId
                }
              </Typography>
              <Typography>NFT Owner:{" "}
                {
                  nftData.owner
                }
              </Typography>
              <Typography>Name Owner:{" "}
                {
                  nftData.nameOwner
                }
              </Typography>
            </Grid>
          )
        }
      </Grid>

    </div>
  )
}

