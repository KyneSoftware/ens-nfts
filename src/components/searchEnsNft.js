/**
 * Search ENS NFT component that queries connected Ethereum service for an existing NFT pointed to by this name
 */

import React, { useState, useEffect } from "react"
import { Grid, TextField, Button, makeStyles, Avatar, Typography, CircularProgress } from "@material-ui/core"
import ExploreIcon from '@material-ui/icons/Explore';
import namehash from 'eth-ens-namehash'
import { useWeb3React } from '@web3-react/core'
import { useSnackbar, closeSnackbar } from 'notistack';

import { useEagerConnect, useInactiveListener } from '../hooks/web3'
import { nameExists, getAddr, getResolver, resolverSet, checkSupportsInterface, getTokenId, getEnsOwner } from '../services/ens'

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
const NO_ADDRESS_SET_TEXT = 'No address set for this name';
const FOUND_TEXT = 'NFT found';
const FOUND_NOT_NFT_TEXT = 'This name does not point to an NFT contract'
const FOUND_NOT_EIP721_TEXT = 'The addressed contract is not ERC721 conformant'
const NOT_EIP_2381_TEXT = 'This name points at more than one NFT'
const TOKEN_ID_NOT_SET_TEXT = 'The tokenID for this name is not set'
const ERROR_TEXT = 'There was a problem searching for this NFT';
const ENS_FORMAT_INCORRECT_TEXT = 'Not a recognised ENS name format';
const ENS_FORMAT_INVALID_TEXT = 'Cannot parse input as an ENS name';

export default function SearchEns() {
  // The value typed into the input textfield
  const [searchValue, setSearchValue] = useState('')
  // This boolean is toggled when search is clicked, then the useEffect triggers to resolve searchValue into an NFT.
  const [searchClicked, setSearchClicked] = useState(false)
  // This boolean tracks whether an NFT was found after a search
  const [nftFound, setNftFound] = useState(false)
  // Address that owns the NFT
  const [nftOwner, setNftOwner] = useState(null)
  // Address of the NFT ERC721 contract
  const [nftAddress, setNftAddress] = useState(null)
  // Token ID of the NFT
  const [nftTokenId, setNftTokenId] = useState(null)
  // Address of the owner of the ENS name
  const [nameOwner, setNameOwner] = useState(null)
  // The helper text for the search input
  const [helperText, setHelperText] = useState(SEARCH_FOR_NFT_TEXT)
  // Whether to show an error on the search input if the user tries to search for an invalid ENS name
  const [validEnsName, setValidEnsName] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  // Snackbar warnings/info popups
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // This effect is triggered when the search button is clicked
  useEffect(() => {

    // We don't want this search to fire on the first render, only when search is clicked.
    if (!!searchValue && searchClicked) {


      // Set all of the state variables
      console.log(`Search button has been clicked. searchClicked: ${searchClicked}. Searching for an NFT addressed by ${searchValue}`)
      setIsLoading(true)
      setNftFound(false)
      setNftAddress(null)
      setNftTokenId(null)
      setNftOwner(null)
      setNameOwner(null)
      setValidEnsName(true)
      setHelperText(SEARCHING_TEXT)
      enqueueSnackbar('Searching', {
        variant: 'default',
      })


      // Try to get the address of this name
      getAddr(searchValue).then(addr => {
        // Ensure address is not null
        if (!!addr) {
          // Address of this name. 
          console.log(`We have found a contract address for this name: ${searchValue.toString()}: ${addr.toString()}`)
          setNftAddress(addr.toString())
          setValidEnsName(true)

          // Check this contract is an ERC721
          checkSupportsInterface(addr, '0x80ac58cd').then((supported) => {
            // Make sure supported === true
            if (!!supported) {
              // We know the name resolves to an address, now get the resolver contract is uses and see if it supports EIP2381
              getResolver(searchValue).then((resolver) => {
                // Check if this resolver uses ERC2381
                checkSupportsInterface(resolver, '0x4b23de55').then((supportsInterface) => {
                  if (!!supportsInterface) {
                    // So far so good, this resolver contract supports the right interface, and the address is an NFT contract, check if a tokenID is set.
                    getTokenId(searchValue, resolver).then((token) => {
                      console.log(`ENS name: ${searchValue}, Associated tokenId: ${token}`)
                      if (!!token) {
                        // We have returned a non zero tokenID from this resolver contract, set it in state.
                        console.log(`We have an ENS token. Adding to state: ${token}`)
                        setNftTokenId(token.toString())
                        setNftFound(true)
                        setHelperText(FOUND_TEXT)

                        // Now retrieve the NFT owner
                        // Get the owner of this ENS name
                        getEnsOwner(searchValue).then((ownerAddress) => {
                          // Owner of this address found
                          if (!!ownerAddress) {
                            console.log(`Setting the owner of this ens name: ${ownerAddress}`)
                            setNftOwner(ownerAddress.toString())
                            setIsLoading(false)
                            closeSnackbar()
                          } else {
                            console.log(`No owner found for this ENS name: ${ownerAddress}`)
                            setIsLoading(false)
                            closeSnackbar()
                          }
                        }).catch(err => {
                          console.error(`Something went wrong getting the owner of the name: ${searchValue}`)
                        })

                      }
                      else {
                        console.log(`tokenID not set. `)
                        setNftFound(false)
                        setIsLoading(false)
                        closeSnackbar()
                        setHelperText(TOKEN_ID_NOT_SET_TEXT)
                      }
                    }).catch(err => {
                      console.log('There was an error calling tokenID on this resolver contract.')
                      console.error(err)
                    })
                  } else {
                    setNftFound(false)
                    setIsLoading(false)
                    closeSnackbar()
                    setHelperText(NOT_EIP_2381_TEXT)
                  }

                }).catch(err => {
                  console.log(`There was an error checking if this resolver contract supports EIP2381`)
                  setNftFound(false)
                  setIsLoading(false)
                  closeSnackbar()
                  setHelperText(NOT_EIP_2381_TEXT)
                })
              }).catch(err => {
                console.log(`There was an error getting the resolver contract for this name, despite an address being set for this name.`)
                console.error(err)
              })
            }
            else {
              // This address is not ERC721
              setNftFound(false)
              setIsLoading(false)
              closeSnackbar()
              setHelperText(FOUND_NOT_EIP721_TEXT)
            }
          }).catch(err => {
            // Something went wrong checking supportsInterface(ERC721)
            setNftFound(false)
            setIsLoading(false)
            closeSnackbar()
            setHelperText(FOUND_NOT_NFT_TEXT)
          })
        } else {
          // This name returned null for the address
          setNftFound(false)
          setIsLoading(false)
          closeSnackbar()
          setHelperText(NO_ADDRESS_SET_TEXT)
        }
      }).catch((err) => {
        // Something went wrong getting the address of this name
        setNftFound(false)
        setIsLoading(false)
        closeSnackbar()
        setHelperText(NOT_FOUND_TEXT)
      })
    }


    return () => {
      console.log('Cleaning up after a search, setting searchClicked back to false')
      setIsLoading(false)
      setSearchClicked(false)
    }
  }, [searchClicked])

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
    setSearchClicked(true)

    // Web3 injected
    // if (connector === undefined) {
    //   enqueueSnackbar('Please use a metamask enabled browser', {
    //     variant: 'error',
    //   })
    //   setHelperText(ERROR_TEXT)
    //   setIsLoading(false)
    //   return
    // }
    // // Web3 unlocked
    // else if (connector !== undefined && !active) {
    //   console.warn('Web3 injected but not enabled.')
    //   enqueueSnackbar('Please unlock your metamask', {
    //     variant: 'warning',
    //   })
    //   setHelperText('Wallet not unlocked')
    //   setIsLoading(false)
    //   return
    // }
    // // Web3 unlocked
    // else if (connector !== undefined && activatingConnector) {
    //   console.warn('Web3 injected but not enabled.')
    //   enqueueSnackbar('Please unlock your metamask', {
    //     variant: 'warning',
    //   })
    //   setHelperText('Wallet not unlocked')
    //   setIsLoading(false)
    //   return
    // }

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
                  nftAddress
                }
              </Typography>
              <Typography>Token ID:{" "}
                {
                  nftTokenId
                }
              </Typography>
              <Typography>NFT Owner:{" "}
                {
                  nftOwner
                }
              </Typography>
              <Typography>Name Owner:{" "}
                {
                  nameOwner
                }
              </Typography>
            </Grid>
          )
        }
      </Grid>

    </div>
  )
}

