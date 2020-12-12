/**
 * Search ENS NFT component that queries connected Ethereum service for an existing NFT pointed to by this name
 */

import React, { useState, useEffect } from "react"
import { TextField, Button, makeStyles, Avatar, Typography, Link, Tooltip, IconButton, List, ListItem, ListItemText, Divider, Card, Grow } from "@material-ui/core"
import ExploreIcon from '@material-ui/icons/Explore';
import FileCopy from '@material-ui/icons/FileCopy';
import namehash from 'eth-ens-namehash'
import { useSnackbar } from 'notistack';
import { getAddr, getResolver, checkSupportsInterface, getTokenId, getEnsOwner, getNftOwner, reverseResolveAddress } from '../services/ens'
import { NftIcon } from "./NftIcon";
import { logger } from '../config/pino';

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
    backgroundColor: '#000000',
    color: '#f6c26c'
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(2),
  },
  submit: {
    margin: theme.spacing(3, 0, 1),
    backgroundColor: '#000000',
  },
}));

// Text for helpers and snackbars
const SEARCH_FOR_NFT_TEXT = 'Search for an NFT by name';
const SEARCHING_TEXT = 'Searching';
const NOT_FOUND_TEXT = 'NFT not found';
const NO_ADDRESS_SET_TEXT = 'No address set for this name';
const FOUND_TEXT = 'NFT found';
const FOUND_NOT_NFT_TEXT = 'This name does not point to an NFT contract'
const FOUND_IS_EIP1155_TEXT = 'This is an ERC1155 NFT, it can have multiple copies'
const FOUND_NOT_EIP721_TEXT = 'The addressed contract is not ERC721 conformant'
const NOT_EIP_2381_TEXT = 'This name does not support named NFTs'
const TOKEN_ID_NOT_SET_TEXT = 'The tokenID for this name is not set'
const ERROR_TEXT = 'There was a problem searching for this NFT';
const ENS_FORMAT_INCORRECT_TEXT = 'Not a recognised ENS name format';
const ENS_FORMAT_INVALID_TEXT = 'Cannot parse input as an ENS name';

// Contract interfaces
const INTERFACE_EIP721 = '0x80ac58cd';
const INTERFACE_EIP1155 = '0xd9b67a26';
const INTERFACE_EIP2381 = '0x4b23de55';

// One liners to generate templated URLs
const nftContractUrl = (address) => `https://etherscan.io/token/${address}`
const nftTokenUrl = (address, token) => `https://etherscan.io/token/${address}?a=${token}`
const erc1155TokenUrl = (address, token) => `https://opensea.io/assets/${address}/${token}`
const nftOwnerUrl = (address) => `https://etherscan.io/address/${address}`
const ensOwnerUrl = (address) => `https://etherscan.io/address/${address}`

export default function SearchEns() {
  // The value typed into the input textfield
  const [searchValue, setSearchValue] = useState('')
  // This boolean is toggled when search is clicked, then the useEffect triggers to resolve searchValue into an NFT.
  const [searchClicked, setSearchClicked] = useState(false)
  // Address of the name's resolver contract
  const [resolverAddress, setResolverAddress] = useState(null)
  // This boolean tracks whether an NFT was found after a search
  const [nftFound, setNftFound] = useState(false)
  // Address that owns the NFT
  const [nftOwner, setNftOwner] = useState(null)
  // ENS name of the address that owns the NFT
  const [nftOwnersENS, setNftOwnersENS] = useState(null)
  // Address of the NFT ERC721 contract
  const [nftAddress, setNftAddress] = useState(null)
  // Token ID of the NFT
  const [nftTokenId, setNftTokenId] = useState(null)
  // Address of the owner of the ENS name
  const [nameOwner, setNameOwner] = useState(null)
  // ENS name of the owner of the ENS name
  const [nameOwnersENS, setNameOwnersENS] = useState(null)
  // The helper text for the search input
  const [helperText, setHelperText] = useState(SEARCH_FOR_NFT_TEXT)
  // Whether to show an error on the search input if the user tries to search for an invalid ENS name
  const [validEnsName, setValidEnsName] = useState(true)
  // While the component is calling the injected Ethereum provider to lookup the ENS name
  const [isLoading, setIsLoading] = useState(false)
  // If the contract address is an ERC721 NFT
  const [isERC721, setIsERC721] = useState(false)
  // If the contract address is an ERC1155 NFT
  const [isERC1155, setIsERC1155] = useState(false)
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

  useEffect(() => {
    if (!isLoading && validEnsName && searchValue !== '') {
      setSearchDisabled(false)
    } else {
      setSearchDisabled(true)
    }
  }, [isLoading, validEnsName, searchValue])

  /* 
    Effect triggered when search is clicked.

    - Gets resolver contract address and sets it to state
    - Gets address pointed at by name and sets it to state
    - Gets ownerOf name and sets it to state

    These three pieces of info trigger more downstream effects
  */
  useEffect(() => {

    // We don't want this search to fire on the first render, only when search is clicked. (So assert searchValue not empty)
    if (!!searchValue && searchClicked) {

      // Set all of the state variables
      console.log(`Search button has been clicked. searchClicked: ${searchClicked}. Searching for an NFT addressed by ${searchValue}`)
      setIsLoading(true)
      setIsERC721(false)
      setIsERC1155(false)
      setNftFound(false)
      setNftAddress(null)
      setNftTokenId(null)
      setNftOwner(null)
      setNameOwner(null)
      setResolverAddress(null)
      setValidEnsName(true)
      setHelperText(SEARCHING_TEXT)
      enqueueSnackbar('Searching', {
        variant: 'default',
      })

      getResolver(searchValue).then((resolver) => {
        setResolverAddress(resolver)
      }).catch((err) => {
        console.log('There was an error getting a resolver contract for this address')
        console.log(err)
      })

      // Get address anyways
      // Now get the address and see if it is ERC721 or ERC1155
      getAddr(searchValue).then((addr) => {
        if (!!addr) {
          // Address of this name. 
          console.log(`We have found a contract address for this name: ${searchValue.toString()}: ${addr.toString()}`)
          setNftAddress(addr.toString())
          setValidEnsName(true)
          setIsLoading(false)
          closeSnackbar()

        } else {
          // This name returned null for the address
          setNftFound(false)
          setIsLoading(false)
          setNftAddress(null)
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
    }


    return () => {
      console.log('Cleaning up after a search, setting searchClicked back to false')
      setIsLoading(false)
      setSearchClicked(false)
    }
  }, [searchClicked, closeSnackbar, enqueueSnackbar, searchValue])

  /*
    Effect triggered when a resolver contract address is set
    Checks if the resolver supports EIP2381, calls resolver.tokenID if it does.
    Sets state accordingly
  */
  useEffect(() => {
    // If resolverContract is defined (prevent trigger on page load)
    if (!!resolverAddress && resolverAddress !== '0x0000000000000000000000000000000000000000') {
      // Check if this resolver uses ERC2381
      checkSupportsInterface(resolverAddress, INTERFACE_EIP2381).then((supportsInterface) => {
        if (!!supportsInterface) {
          // So far so good, this resolver contract supports the right interface, check if a tokenID is set.
          getTokenId(searchValue, resolverAddress).then((token) => {
            console.log(`ENS name: ${searchValue}, Associated tokenId: ${token}`)
            if (!!token) {
              // We have returned a non zero tokenID from this resolver contract, set it in state.
              console.log(`We have an ENS token. Adding to state: ${token}`)
              setNftTokenId(token.toString())
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
    }
    else {
      // Do nothing for now
    }
    return () => { }
  }, [resolverAddress])


  /*
    Effect triggered when ENS Owner or NFT Owner states update. 
    Checks if they have a reverse resolver for their address set.
    If they do, set it in state.
  */
  useEffect(() => {
    // If nameOwner is defined (prevent trigger on page load)
    if (!!nameOwner) {
      reverseResolveAddress(nameOwner).then((ensName) => {
        // Confirm the lookup didn't return null or empty string
        if (!!ensName && ensName !== '') {
          setNameOwnersENS(ensName)
          logger.debug(`****\n\n This name is owned by: ${ensName}`)
        } else {
          // Reset name back to null
          setNameOwnersENS(null)
        }
      })

    }
    if (!!nftOwner) {
      reverseResolveAddress(nftOwner).then((nftOwnerName) => {
        // Confirm the lookup didn't return null or empty string
        if (!!nftOwnerName && nftOwnerName !== '') {
          setNftOwnersENS(nftOwnerName)
          logger.debug(`****\n\n This NFT is owned by: ${nftOwnerName}`)
        } else {
          // Reset name back to null
          setNftOwnersENS(null)
        }
      })
    }
    return () => { }
  }, [nameOwner, nftOwner])

  /*
    Effect triggered when contract address state updates. 
    Uses ERC165 to check if this contract is 721, 1155 or other
    Sets UI accordingly
  */
  useEffect(() => {
    // If nftAddress is defined (prevent trigger on page load)
    if (!!nftAddress) {
      console.log(`Nft Address Set: ${nftAddress}. Checking if this contract supports a known interface.`);
      const is721 = checkSupportsInterface(nftAddress, INTERFACE_EIP721)
      const is1155 = checkSupportsInterface(nftAddress, INTERFACE_EIP1155)
      Promise.all([is721, is1155]).then((results) => {
        console.log(`\n\n\n******Checking if a given address matches a specific type: Results: `)
        console.log(results)

        // Update UI based on what type this token contract responds to.
        if (results[0] === true) {
          setHelperText(FOUND_TEXT)
          setIsERC721(true)
          setIsERC1155(false)
        }
        else if (results[1] === true) {
          // This is ERC1155, so cannot retrieve the NFT owner
          // setNftFound(true)
          // setIsLoading(false)
          setHelperText(FOUND_IS_EIP1155_TEXT)
          setIsERC721(false)
          setIsERC1155(true)
        }
        else {
          setHelperText(FOUND_NOT_NFT_TEXT)
          setIsERC721(false)
          setIsERC1155(false)

        }
      })
    }
    else {
      // Do nothing for now
    }
    return () => { }
  }, [nftAddress])

  /*
    Effect triggered when isERC721 set to true.
    Can only call `ownerOf` on a 721, not a 1155, so this contract fires and tries to set the NFT owner value. 
    Sets state accordingly
  */
  useEffect(() => {
    // If nftAddress is defined (prevent trigger on page load), and isERC721 set to true
    if (!!nftAddress && !!nftTokenId && isERC721) {
      // This is ERC721 retrieve the NFT owner
      getNftOwner(nftAddress, nftTokenId).then((nftOwnerAddress) => {
        // Owner of this address found
        if (!!nftOwnerAddress) {
          console.log(`Setting the owner of this NFT: ${nftOwnerAddress}`)
          setNftOwner(nftOwnerAddress.toString())
        } else {
          console.log(`No owner found for this NFT: ${nftAddress} ${nftTokenId}`)
        }
      }).catch(err => {
        console.error(`Something went wrong getting the owner of the NFT: ${nftAddress} ${nftTokenId}`)
      })
    }
    else {
      // Do nothing for now
    }
    return () => { }
  }, [isERC721, nftAddress, nftTokenId])



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
      <Typography component="h1" variant="h5" gutterBottom>
        Search for a named NFT
      </Typography>
      <form className={classes.form} noValidate spellCheck={false} onSubmit={onSubmit}>
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
          type="url"
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
                      nftTokenId.length > 10 ? nftTokenId.substr(0, 7) + "..." + nftTokenId.substr(nftTokenId.length - 5) : nftTokenId
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
            {
              nftOwner &&
              <Divider />
            }
            {
              nftOwner &&
              <ListItem>
                <ListItemText secondary="The current owner of this NFT">
                  NFT Owner:{" "}
                  <Link href={nftOwnerUrl(nftOwner)} target="_blank" rel="noreferrer">
                    {
                      !!nftOwnersENS ? nftOwnersENS : nftOwner.substr(0, 7) + "..." + nftOwner.substr(nftOwner.length - 5)
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
            {
              isERC1155 &&
              <Divider />
            }
            {
              isERC1155 &&
              <ListItem>
                <ListItemText secondary="ERC1155 Tokens can have a number of copies">
                  Quantity:{" "}
                  <Link href={erc1155TokenUrl(nftAddress, nftTokenId)} target="_blank" rel="noreferrer">
                    {
                      "View on Opensea"
                    }
                  </Link>

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
                      !!nameOwnersENS ? nameOwnersENS : nameOwner.substr(0, 7) + "..." + nameOwner.substr(nameOwner.length - 5)
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

