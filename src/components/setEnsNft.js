/**
 * Sets and ENS name to point at an existing NFT
 */

import React, { useState, useEffect } from "react"
import { Grid, TextField, Button, makeStyles, Avatar, Typography, Link } from "@material-ui/core"
import FiberNewIcon from '@material-ui/icons/FiberNew';
import namehash from 'eth-ens-namehash'
import { getEnsOwner, nameExists } from '../services/ens'

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
  link: {
    color: 'rebeccapurple'
  }
}));

const NAME_TEXT_DEFAULT = 'An ENS (sub)domain that already exists and you control';
const NAME_TEXT_ENTERED = 'The name to point at your NFT';
const NAME_TEXT_INVALID = 'Invalid characters for an ENS name';
const NAME_TEXT_INCORRECT = 'Not a recognised ENS name format';
const NAME_TEXT_NONEXISTANT = 'This ENS name does not exist';
const NAME_TEXT_UNAUTHORISED = 'Connected account does not administer this name';
const ADDRESS_TEXT_DEFAULT = 'The contract address this NFT is in';
const ADDRESS_TEXT_NONEXISTANT = 'This contract address doesn\'t exist on this network';
const ADDRESS_TEXT_NON_ERC721 = 'This contract address is not ERC721 conformant';
const ADDRESS_TEXT_ENTERED = 'The ERC721 Contract address';
const TOKEN_TEXT_DEFAULT = 'The NFTs unique token ID';
const TOKEN_TEXT_NONEXISTANT = 'This TokenID is not present in this contract';
const TOKEN_TEXT_INVALID = 'TokenID should be a number';
const TOKEN_TEXT_INCORRECT = 'This TokenID is not the right length';
const TOKEN_TEXT_ENTERED = 'The unique ID of your NFT';

export default function SetEnsToNft() {
  // ENS name to set
  const [ensName, setEnsName] = useState('')
  // ERC721 Contract Address to resolve the name to
  const [contractAddress, setContractAddress] = useState('0x0')
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

  // Whether to run the ens searches upon a submit being clicked
  const [setNameClicked, setSetNameClicked] = useState(false)

  // Whether the Tx confirmation modal is visible
  const [showModal, setShowModal] = useState(false)

  // The effect that runs when submit is clicked
  useEffect(() =>{
    console.log(`Set Name clicked, checking the validity of these fields before launching confirmation modal.`)
    return () => {
      setSetNameClicked(false)
    }
  }, [setNameClicked])

  // Handle name change
  const onNameChange = event => {
    const name = event.target.value
    setEnsName(name)

    // Normalise the input
    var normalized;
    try {
      normalized = namehash.normalize(name)
      console.log('Setting an NFT resolver for: ' + namehash.hash(normalized))
    } catch {
      setValidEnsName(false)
      setNameHelperText(NAME_TEXT_INVALID)
      return
    }

    // Should be .eth for now, even though there can be other TLDs (Technically .test is valid on Ropsten but will have to fix that next)
    const tail = normalized.substr(normalized.length - 4)
    // console.log(`Normalised version of input: ${name} is ${normalized}. The last 4 chars are: ${tail}`)

    if (name === normalized && tail === '.eth') {
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
    if(!!exists){
      setValidEnsName(true)
    } else {
      // Don't interfere with an invalid format helper text by checking if this field is otherwise currently okay
      if(validEnsName) {
        setNameHelperText(NAME_TEXT_NONEXISTANT)
      }
      setValidEnsName(false)
    }

    
    try {
      // Now check if the current account is an admin of the address
      console.log(`Does accounts[0](${JSON.stringify(window.ethereum)}) control this name?`)
      const connectedAddress = window.ethereum.selectedAddress
      console.log(`Checking if ${connectedAddress} is an admin of ${ensName}`)
      const ensOwner = await getEnsOwner(ensName)

      if(connectedAddress.toString().toLowerCase() === ensOwner.toString().toLowerCase()) {
        console.log(`The connected account is the owner of this ENS name.`)
      } else {
        console.log(`Connected account is not the owner of this address`)
        if(!!validEnsName) {
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
    setContractAddress(event.target.value)
    console.log('Contract address of NFT: ' + contractAddress)
    setContractAddressHelperText(ADDRESS_TEXT_ENTERED)
  }

  const onTokenChange = event => {
    setTokenId(event.target.value)
    console.log('Token ID : ' + tokenId)
    setTokenIdHelperText(TOKEN_TEXT_ENTERED)
  }

  // Triggers a contract interaction to set a name
  const onSubmit = event => {
    event.preventDefault();
    console.log('Setting  resolver for: ' + ensName)
    setIsLoading(true)
    setSetNameClicked(true)

    setTimeout(()=>{
      setValidEnsName(false)
      setValidTokenId(false)
      setValidContractAddress(false)
      setIsLoading(false)
    },1000)
    
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
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              error={!validContractAddress}
              onChange={onContractChange}
              helperText={contractAddressHelperText}
              disabled={isLoading}
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
              error={!validTokenId}
              onChange={onTokenChange}
              helperText={tokenIdHelperText}
              disabled={isLoading}
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
          disabled={isLoading}
          className={classes.submit}
        >
          Set Name
          </Button>
        <Grid container justify="flex-end">
          <Grid item>
            <Link href="#" variant="body2" className={classes.link}>
              Bug report? Click Here
            </Link>
          </Grid>
        </Grid>
      </form>
    </div>
  )
}

