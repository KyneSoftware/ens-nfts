/**
 * Sets and ENS name to point at an existing NFT
 */

import React, { useState, useEffect } from "react"
import { Grid, TextField, Button, makeStyles, Avatar, Typography, Link } from "@material-ui/core"
import FiberNewIcon from '@material-ui/icons/FiberNew';
import namehash from 'eth-ens-namehash'
import { getEnsOwner, nameExists, contractExists, checkContractSupportsInterface, tokenExists } from '../services/ens'
import { ethers } from 'ethers'
import SetNameDialog from "./SetNameDialog";

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: '#2E4057',
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
    backgroundColor: '#2E4057',
  },
  link: {
    color: '#2E4057'
  }
}));

const NAME_TEXT_DEFAULT = 'An ENS (sub)domain that already exists and you control';
const NAME_TEXT_ENTERED = 'The name to point at your NFT';
const NAME_TEXT_INVALID = 'Invalid characters for an ENS name';
const NAME_TEXT_INCORRECT = 'Not a recognised ENS name format';
const NAME_TEXT_NONEXISTANT = 'This ENS name does not exist';
const NAME_TEXT_UNAUTHORISED = 'Connected account does not own this name';
const ADDRESS_TEXT_DEFAULT = 'The contract address this NFT is in';
const ADDRESS_TEXT_INVALID = 'Contract address should start with 0x';
const ADDRESS_TEXT_INVALID_CHARS = 'Contract address should be a hexadecimal string';
const ADDRESS_TEXT_INCOMPLETE = 'Not the correct length for a contract address';
const ADDRESS_TEXT_NONEXISTANT = 'Contract does not exist on this network';
const ADDRESS_TEXT_NON_ERC721 = 'Contract is not an ERC721 type';
const ADDRESS_TEXT_CHECKSUM_INVALID = 'The checksum for this address is incorrect';
const ADDRESS_TEXT_UNKNOWN = 'Unknown Error Occurred';
const ADDRESS_TEXT_ENTERED = 'The ERC721 Contract address';
const TOKEN_TEXT_DEFAULT = 'The NFTs unique token ID';
const TOKEN_TEXT_NONEXISTANT = 'This TokenID is not present in this contract';
const TOKEN_TEXT_INVALID = 'TokenID should be a number';
const TOKEN_TEXT_ENTERED = 'The unique ID of your NFT';
const TOKEN_TEXT_FOUND = 'Cool NFT, I like it';

export default function SetEnsToNft() {
  // ENS name to set
  const [ensName, setEnsName] = useState('')
  // ERC721 Contract Address to resolve the name to
  const [contractAddress, setContractAddress] = useState('')
  // TokenID within contract address, for setting EIP2381 resolver
  const [tokenId, setTokenId] = useState('')

  // Helper text for the Name input
  const [nameHelperText, setNameHelperText] = useState(NAME_TEXT_DEFAULT)
  // Helper text for the contract address input
  const [contractAddressHelperText, setContractAddressHelperText] = useState(ADDRESS_TEXT_DEFAULT)
  // Helper text for the token ID input
  const [tokenIdHelperText, setTokenIdHelperText] = useState(TOKEN_TEXT_DEFAULT)

  // Whether name input is valid or should be in an error state
  const [validEnsName, setValidEnsName] = useState(true)
  // Whether contract address input is valid or should be in an error state
  const [validContractAddress, setValidContractAddress] = useState(true)
  // Whether tokenID input is valid or should be in an error state
  const [validTokenId, setValidTokenId] = useState(true)

  // Whether to disable input while sending transaction
  const [isLoading, setIsLoading] = useState(false)

  // Whether to disable input while sending transaction
  const [setNameButtonDisabled, setSetNameButtonDisabled] = useState(true)

  // Whether to run the ens searches upon a submit being clicked
  const [setNameClicked, setSetNameClicked] = useState(false)

  // Whether the Tx confirmation dialog is visible
  const [showDialog, setShowDialog] = useState(false)

  // The effect that runs when submit is clicked
  useEffect(() => {
    console.log(`Set Name clicked, checking the validity of these fields before launching confirmation modal.`)
    if(validEnsName && validContractAddress && validTokenId && ensName !== '' && contractAddress !== '' && tokenId !== '' && setNameClicked){
      setShowDialog(true)
    }
    return () => {
      setSetNameClicked(false)
    }
  }, [setNameClicked])

  const onModalClose = () => {
    setShowDialog(false)
    setIsLoading(false)
  }

  // The effect that decides whether setName button should be enabled or disabled
  useEffect(() => {
    console.log(`Checking if setName button should be enabled. isLoading: ${isLoading.toString()}, validEnsName: ${validEnsName.toString()}, validContractAddress: ${validContractAddress.toString()}, validTokenId: ${validTokenId.toString()}, web3Connected: ?`)
    if (!isLoading && validEnsName && validContractAddress && validTokenId && ensName !== '' && contractAddress !== '' && tokenId !== '') {
      console.log(`Everything checks out, enabling the setName button for clicking`)
      setSetNameButtonDisabled(false)
    } else {
      console.log(`Not all checks passed, disabling setName button`)
      setSetNameButtonDisabled(true)
    }
  }, [isLoading, validEnsName, validContractAddress, validTokenId])

  // Handle name change
  const onNameChange = event => {
    const name = event.target.value
    setEnsName(name)

    // Normalise the input
    var normalized;
    try {
      normalized = namehash.normalize(name)
      // console.log('Setting an NFT resolver for: ' + namehash.hash(normalized))
    } catch {
      setValidEnsName(false)
      setNameHelperText(NAME_TEXT_INVALID)
      return
    }

    // Should be .eth for now, even though there can be other TLDs (Technically .test is valid on Ropsten but will have to fix that next)
    const tail = normalized.substr(normalized.length - 4)
    // console.log(`Normalised version of input: ${name} is ${normalized}. The last 4 chars are: ${tail}`)

    if (name.toLowerCase() === normalized && tail === '.eth') {
      setValidEnsName(true)
      setNameHelperText(NAME_TEXT_ENTERED)
    } else {
      setValidEnsName(false)
      setNameHelperText(NAME_TEXT_INCORRECT)
    }
  }

  // When exiting the name field, check the name exists and that this account is an owner or admin
  const onNameMouseOut = async (event) => {
    console.log(`MouseOut of name, check if it exists.`)
    const exists = await nameExists(ensName)
    console.log(`Does ${ensName} exist? ${exists.toString()}`)
    if (!!exists) {
      setValidEnsName(true)
    } else {
      // Don't interfere with an invalid format helper text by checking if this field is otherwise currently okay
      if (validEnsName) {
        setNameHelperText(NAME_TEXT_NONEXISTANT)
      }
      setValidEnsName(false)
      return
    }

    try {
      // Now check if the current account is an admin of the address
      const connectedAddress = typeof window !== `undefined` ? window.ethereum.selectedAddress : ''
      console.log(`Checking if ${connectedAddress} is an admin of ${ensName}`)
      const ensOwner = await getEnsOwner(ensName)

      if (connectedAddress.toString().toLowerCase() === ensOwner.toString().toLowerCase()) {
        console.log(`The connected account is the owner of this ENS name.`)
      } else {
        console.log(`Connected account is not the owner of this address`)
        if (!!validEnsName) {
          setNameHelperText(NAME_TEXT_UNAUTHORISED)
          setValidEnsName(false)
        }
      }
    } catch {
      console.error(`There was an issue accessing the connected ethereum account`)
    }

  }

  // Handle contract address input change
  const onContractChange = event => {
    const contract = event.target.value
    setContractAddress(contract)
    console.log('Contract address of NFT: ' + contract)

    // Check if the contract address starts with 0x
    if (contract.substring(0, 2) !== '0x') {
      setValidContractAddress(false)
      setContractAddressHelperText(ADDRESS_TEXT_INVALID)
      return
    }

    // Check the contract address is a hex number
    if (!contract.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
      setValidContractAddress(false)
      setContractAddressHelperText(ADDRESS_TEXT_INVALID_CHARS)
      return
    }

    // Check if the contract address is the right length
    if (contract.length !== 42) {
      setValidContractAddress(false)
      setContractAddressHelperText(ADDRESS_TEXT_INCOMPLETE)
      return
    }

    // Check if the address checksum is valid
    try {
      ethers.utils.getAddress(contract)
      console.debug(`No issues found with address: ${contract}`)
    } catch (e) {
      console.log(`There was an error with this contract address`)
      console.error(e)
      setValidContractAddress(false)
      setContractAddressHelperText(ADDRESS_TEXT_CHECKSUM_INVALID)
      return
    }

    setValidContractAddress(true)
    setContractAddressHelperText(ADDRESS_TEXT_ENTERED)
  }

  // When exiting the contract field, check the address exists and that the address is ERC721 conformant
  const onContractMouseOut = async (event) => {
    console.debug(`MouseOut of contract address, check if it exists.`)
    
    // Check contract exists
    try {
      const exists = await contractExists(contractAddress)
      console.log(`Does ${contractAddress} exist? ${exists.toString()}`)
      if (!!exists) {
        setValidContractAddress(true)
      } else {
        // Don't interfere with an invalid format helper text by checking if this field is otherwise currently okay
        if (validContractAddress) {
          setContractAddressHelperText(ADDRESS_TEXT_NONEXISTANT)
        }
        setValidContractAddress(false)
        return
      }
    } catch (e) {
      console.log(`There was an exception thrown while checking the validity of the contractAddress we want to set a name to point at.`)
      console.error(e)
      setValidContractAddress(false)
      setContractAddressHelperText(ADDRESS_TEXT_UNKNOWN)
    }

    // Check contract responds to erc165 supportsInterface(721contractInterface)
    try {
      // Now check if the current account is an admin of the address
      console.debug(`Checking if ${contractAddress} has erc165 support, and subsequently if it interfaces ERC721.`)
      checkContractSupportsInterface(contractAddress, '0x80ac58cd').then((supported)=>{
        if(!supported) {
          if (validContractAddress) {
            setContractAddressHelperText(ADDRESS_TEXT_NON_ERC721)
          }
          setValidContractAddress(false)

        }
      })
      
    } catch (e) {
      console.error(`There was an issue checking if ${contractAddress.toString()} was an ERC721 contract.`)
      console.error(e)
    }

  }

  // Checks the token input is a numerical string
  const onTokenChange = async (event) => {
    const token = event.target.value
    console.debug('Token ID : ' + token)
    setTokenId(token)

    // Check token contains only digits
    if(!token.match(/(^[0-9]+$)/)){
      setValidTokenId(false)
      setTokenIdHelperText(TOKEN_TEXT_INVALID)
      return
    }

    setValidTokenId(true)
    setTokenIdHelperText(TOKEN_TEXT_ENTERED)
  }

  // When exiting the TokenId field, check the token exists within the contract address 
  const onTokenMouseOut = async (event) => {
    const token = event.target.value
    console.debug(`MouseOut of tokenID, check if ${token} exists in contract ${contractAddress}.`)

    tokenExists(contractAddress, tokenId).then((exists)=>{
      console.log(`Token ${tokenId} exists in contract ${contractAddress}. ${!!exists.toString()}`)
      if(!!exists){
        setValidTokenId(true)
        setTokenIdHelperText(TOKEN_TEXT_FOUND)
      } else {
        console.log(`This token ${tokenId} was not found in contract ${contractAddress}`)
        setValidTokenId(false)
        setTokenIdHelperText(TOKEN_TEXT_NONEXISTANT)
      }

    }).catch((err)=>{
      console.error(`There was an error thrown while checking if ${tokenId} exists on contract ${contractAddress}`)
      console.error(err)
      setValidTokenId(false)
      setTokenIdHelperText(TOKEN_TEXT_NONEXISTANT)
    })
  }

  // Triggers a contract interaction to set a name
  const onSubmit = event => {
    event.preventDefault();
    console.log('Setting  resolver for: ' + ensName)
    setIsLoading(true)
    setSetNameClicked(true)

    // setTimeout(() => {
    //   // setValidEnsName(false)
    //   // setValidTokenId(false)
    //   // setValidContractAddress(false)
    //   setIsLoading(false)
    // }, 1000)

  }


  const classes = useStyles();
  return (
    <div className={classes.paper}>
      <Avatar className={classes.avatar}>
        <FiberNewIcon />
      </Avatar>
      <Typography component="h1" variant="h5">
        Name an NFT with ENS
          </Typography>
      <form className={classes.form} noValidate onSubmit={onSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              error={!validEnsName}
              onChange={onNameChange}
              onBlur={onNameMouseOut}
              helperText={nameHelperText}
              disabled={isLoading}
              name="ensName"
              variant="outlined"
              required
              fullWidth
              id="ensName"
              label="ENS Name"
              type="url"
              autoCapitalize="off" 
              autoComplete="off"
              spellCheck="false" 
              autoCorrect="off"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              error={!validContractAddress}
              onChange={onContractChange}
              onBlur={onContractMouseOut}
              helperText={contractAddressHelperText}
              disabled={isLoading}
              variant="outlined"
              required
              fullWidth
              id="contractAddress"
              label="NFT Contract Address"
              name="contractAddress"
              type="url"
              autoCapitalize="off" 
              autoComplete="off"
              spellCheck="false" 
              autoCorrect="off"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              error={!validTokenId}
              onChange={onTokenChange}
              onBlur={onTokenMouseOut}
              helperText={tokenIdHelperText}
              disabled={isLoading}
              variant="outlined"
              required
              fullWidth
              id="tokenId"
              label="Token ID"
              name="tokenId"
              type="url"
              autoCapitalize="off" 
              autoComplete="off"
              spellCheck="false" 
              autoCorrect="off"
            />
          </Grid>
        </Grid>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={setNameButtonDisabled}
          className={classes.submit}
        >
          Set Name
          </Button>
          <SetNameDialog open={showDialog} onClose={onModalClose} contractAddress={contractAddress} tokenId={tokenId} ensName={ensName}/>
        <Grid container justify="flex-end">
          <Grid item>
            <Link href="https://github.com/OisinKyne/ens_nfts/issues/" variant="body2" className={classes.link} target="_blank" rel="noreferrer">
              Bug report? Click Here
            </Link>
          </Grid>
        </Grid>
      </form>
    </div>
  )
}

