/**
 * Search ENS NFT component that queries connected Ethereum service for an existing NFT pointed to by this name
 */

import React, { useState, useEffect } from "react"
import { TextField, Button, makeStyles, Avatar, Typography,  Link, Tooltip, IconButton, List, ListItem, ListItemText, Divider, Card, Grow } from "@material-ui/core"
import ExploreIcon from '@material-ui/icons/Explore';
import FileCopy from '@material-ui/icons/FileCopy';
import namehash from 'eth-ens-namehash'
import { useSnackbar, closeSnackbar } from 'notistack';
import { getAddr, getResolver, checkResolverSupportsInterface, getTokenId, getEnsOwner, getNftOwner } from '../services/ens'
import { NftIcon } from "./NftIcon";

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  card: {
    marginTop: theme.spacing(1),
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(3, 0, 1, 0),
    backgroundColor: 'midnightblue',
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(2),
  },
  submit: {
    margin: theme.spacing(3, 0, 1),
    backgroundColor: 'midnightblue',
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

const nftContractUrl = (address) => `https://etherscan.io/token/${address}`
const nftTokenUrl = (address, token) => `https://etherscan.io/token/${address}?a=${token}`
const nftOwnerUrl = (address) => `https://etherscan.io/address/${address}`
const ensOwnerUrl = (address) => `https://etherscan.io/address/${address}`

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
  // While the component is calling the injected Ethereum provider to lookup the ENS name
  const [isLoading, setIsLoading] = useState(false)
  // Whether the search button should be disabled
  const [searchDisabled, setSearchDisabled] = useState(true)
  // Snackbar warnings/info popups
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // 'Copied!' Tooltips
  const [nftContractTooltipOpen, setNftContractTooltipOpen] = React.useState(false);
  const [nftTokenTooltipOpen, setNftTokenTooltipOpen] = React.useState(false);
  const [nftOwnerTooltipOpen, setNftOwnerTooltipOpen] = React.useState(false);
  const [nameOwnerTooltipOpen, setNameOwnerTooltipOpen] = React.useState(false);

  // 'Copied!' Tooltips show/hide functions
  const handleNftCopyClose = () => {
    setNftContractTooltipOpen(false);
  };
  const handleNftCopy = () => {
    navigator.clipboard.writeText(nftAddress)
    setNftContractTooltipOpen(true);
    setTimeout(() => setNftContractTooltipOpen(false), 500)
  };
  const handleTokenCopyClose = () => {
    setNftTokenTooltipOpen(false);
  };
  const handleTokenCopy = () => {
    navigator.clipboard.writeText(nftTokenId)
    setNftTokenTooltipOpen(true);
    setTimeout(() => setNftTokenTooltipOpen(false), 500)
  };
  const handleTokenOwnerCopyClose = () => {
    setNftOwnerTooltipOpen(false);
  };
  const handleTokenOwnerCopy = () => {
    navigator.clipboard.writeText(nftOwner)
    setNftOwnerTooltipOpen(true);
    setTimeout(() => setNftOwnerTooltipOpen(false), 500)
  };
  const handleNameOwnerCopyClose = () => {
    setNameOwnerTooltipOpen(false);
  };
  const handleNameOwnerCopy = () => {
    navigator.clipboard.writeText(nameOwner)
    setNameOwnerTooltipOpen(true);
    setTimeout(() => setNameOwnerTooltipOpen(false), 500)
  };

  useEffect(()=>{
    if(!isLoading && validEnsName && searchValue !== ''){
      setSearchDisabled(false)
    } else {
      setSearchDisabled(true)
    }
  }, [isLoading, validEnsName])

  /* 
    Effect triggered when search is clicked.

    - Lookup ENS registry contract
    - Check if the namehash of this name is present (making sure not to get disrupted by the fallback to the old registry)
    - See if that ens record has a resolver contract set
    - See if the resolver responds to an ERC165 in the manner to suggest it supports EIP2381 (0x4b23de55)
    - If yes: Query the resolvers tokenId() function 
    - If yes: See if that resolver contract has an address set
    - If yes: See if that address responds to an ERC165 in the manner to suggest it is an ERC721 contract

  */
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
          checkResolverSupportsInterface(addr, '0x80ac58cd').then((supported) => {
            // Make sure supported === true
            if (!!supported) {
              // We know the name resolves to an address, now get the resolver contract is uses and see if it supports EIP2381
              getResolver(searchValue).then((resolver) => {
                // Check if this resolver uses ERC2381
                checkResolverSupportsInterface(resolver, '0x4b23de55').then((supportsInterface) => {
                  if (!!supportsInterface) {
                    // So far so good, this resolver contract supports the right interface, and the address is an NFT contract, check if a tokenID is set.
                    getTokenId(searchValue, resolver).then((token) => {
                      console.log(`ENS name: ${searchValue}, Associated tokenId: ${token}`)
                      if (!!token) {
                        // We have returned a non zero tokenID from this resolver contract, set it in state.
                        console.log(`We have an ENS token. Adding to state: ${token}`)
                        setNftTokenId(token.toString())
                        setHelperText(FOUND_TEXT)

                        // Now retrieve the NFT owner
                        getNftOwner(addr, token).then((nftOwnerAddress) => {
                          // Owner of this address found
                          if (!!nftOwnerAddress) {
                            console.log(`Setting the owner of this NFT: ${nftOwnerAddress}`)
                            setNftOwner(nftOwnerAddress.toString())
                            setIsLoading(false)
                            closeSnackbar()
                          } else {
                            console.log(`No owner found for this NFT: ${addr} ${token}`)
                            setIsLoading(false)
                            closeSnackbar()
                          }
                        }).catch(err => {
                          console.error(`Something went wrong getting the owner of the NFT: ${addr} ${token}`)
                        })

                        // Get the owner of this ENS name
                        getEnsOwner(searchValue).then((ownerAddress) => {
                          // Owner of this address found
                          if (!!ownerAddress) {
                            console.log(`Setting the owner of this ens name: ${ownerAddress}`)
                            setNameOwner(ownerAddress.toString())
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

                        // Finally mark the NFT as found
                        setNftFound(true)

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
                setHelperText(ERROR_TEXT)
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



  // When a name is typed into the search box, clear existing found NFT
  const onChange = event => {
    const search = event.target.value
    setSearchValue(search)
    setNftFound(false)
    setNftAddress(null)
    setNftOwner(null)
    setNameOwner(null)
    setNftTokenId(null)

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

    if (search.toLowerCase() === normalized && tail === '.eth') {
      setValidEnsName(true)
      setHelperText(SEARCH_FOR_NFT_TEXT)
    } else {
      setValidEnsName(false)
      setHelperText(ENS_FORMAT_INCORRECT_TEXT)
    }
  }


  const onSubmit = event => {
    event.preventDefault();
    setSearchClicked(true)

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
          autoCapitalize="off" 
          autoComplete="off"
          spellCheck="false" 
          autoCorrect="off"
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          className={classes.submit}
          disabled={searchDisabled}
        >
          Lookup NFT
      </Button>
      </form>


     
          <Grow in={nftFound}>
            <Card variant="outlined" className={classes.card}>

              <Avatar className={classes.avatar}>
                <NftIcon />
              </Avatar>

              <Typography component="h1" variant="h5">{searchValue}</Typography>

              <List >
                {
                  nftAddress &&
                  <ListItem>
                    <ListItemText secondary="The address this NFT belongs to">
                      Contract Address:{" "}
                      <Link href={nftContractUrl(nftAddress)} target="_blank" rel="noreferrer">
                        {
                          nftAddress.substr(0, 7) + "..." + nftAddress.substr(nftAddress.length - 5)
                        }
                      </Link>
                      {" "}
                      <Tooltip
                        PopperProps={{
                          disablePortal: true,
                        }}
                        interactive
                        onClose={handleNftCopyClose}
                        open={nftContractTooltipOpen}
                        disableFocusListener
                        disableHoverListener
                        disableTouchListener
                        title="Copied"
                      >
                        <IconButton variant="outlined" aria-label="copy" onClick={handleNftCopy} size="small"><FileCopy variant="outlined" fontSize="inherit" /></IconButton>
                      </Tooltip>
                    </ListItemText>
                  </ListItem>
                }
                <Divider />
                {
                  nftTokenId &&
                  <ListItem>
                    <ListItemText secondary="The ID of this NFT" >Token ID:{" "}
                      <Link href={nftTokenUrl(nftAddress, nftTokenId)} target="_blank" rel="noreferrer">
                        {
                          nftTokenId.substr(0, 7) + "..." + nftTokenId.substr(nftTokenId.length - 5)
                        }
                      </Link>
                      {" "}
                      <Tooltip
                        PopperProps={{
                          disablePortal: true,
                        }}
                        interactive
                        onClose={handleTokenCopyClose}
                        open={nftTokenTooltipOpen}
                        disableFocusListener
                        disableHoverListener
                        disableTouchListener
                        title="Copied"
                      >
                        <IconButton variant="outlined" aria-label="copy" onClick={handleTokenCopy} size="small"><FileCopy variant="outlined" fontSize="inherit" /></IconButton>
                      </Tooltip>
                    </ListItemText>
                  </ListItem>
                }
                <Divider />
                {
                  nftOwner &&
                  <ListItem>
                    <ListItemText secondary="The current owner of this NFT">
                      NFT Owner:{" "}
                      <Link href={nftOwnerUrl(nftOwner)} target="_blank" rel="noreferrer">
                        {
                          nftOwner.substr(0, 7) + "..." + nftOwner.substr(nftOwner.length - 5)
                        }
                      </Link>
                      {" "}
                      <Tooltip
                        PopperProps={{
                          disablePortal: true,
                        }}
                        interactive
                        onClose={handleTokenOwnerCopyClose}
                        open={nftOwnerTooltipOpen}
                        disableFocusListener
                        disableHoverListener
                        disableTouchListener
                        title="Copied"
                      >
                        <IconButton variant="outlined" aria-label="copy" onClick={handleTokenOwnerCopy} size="small"><FileCopy variant="outlined" fontSize="inherit" /></IconButton>
                      </Tooltip>
                    </ListItemText>
                  </ListItem>
                }
                <Divider />
                {
                  nameOwner &&
                  <ListItem>
                    <ListItemText secondary="The address that owns this ENS name">Name Owner:{" "}
                      <Link href={ensOwnerUrl(nameOwner)} target="_blank" rel="noreferrer">
                        {
                          nameOwner.substr(0, 7) + "..." + nameOwner.substr(nameOwner.length - 5)
                        }
                      </Link>
                      {" "}
                      <Tooltip
                        PopperProps={{
                          disablePortal: true,
                        }}
                        interactive
                        onClose={handleNameOwnerCopyClose}
                        open={nameOwnerTooltipOpen}
                        disableFocusListener
                        disableHoverListener
                        disableTouchListener
                        title="Copied"
                      >
                        <IconButton variant="outlined" aria-label="copy" onClick={handleNameOwnerCopy} size="small"><FileCopy variant="outlined" fontSize="inherit" /></IconButton>
                      </Tooltip>
                    </ListItemText>
                  </ListItem>
                }
              </List>

            </Card>
          </Grow>
    </div>
  )
}

