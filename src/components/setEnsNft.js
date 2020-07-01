/**
 * Sets and ENS name to point at an existing NFT
 */

import React, { useState } from "react"
import { Grid, TextField, Button, makeStyles, Avatar, Typography, Link } from "@material-ui/core"
import FiberNewIcon from '@material-ui/icons/FiberNew';
import namehash from 'eth-ens-namehash'

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



export default function SetEnsToNft() {
  // ENS name to set
  const [ensName, setEnsName] = useState('')
  // ERC721 Contract Address to resolve the name to
  const [contractAddress, setContractAddress] = useState('0x0')
  // TokenID within contract address, for setting EIP2381 resolver
  const [tokenId, setTokenId] = useState('')

  // Helper text for the Name input
  const [nameHelperText, setNameHelperText] = useState('An ENS (sub)domain that already exists and you control')
  // Helper text for the contract address input
  const [contractAddressHelperText, setContractAddressHelperText] = useState('This contract address this NFT is in')
  // Helper text for the token ID input
  const [tokenIdHelperText, setTokenIdHelperText] = useState('The NFTs unique ID')

  // Whether name input is valid or should be in an error state
  const [validEnsName, setValidEnsName] = useState(true)
  // Whether contract address input is valid or should be in an error state
  const [validContractAddress, setValidContractAddress] = useState(true)
  // Whether tokenID input is valid or should be in an error state
  const [validTokenId, setValidTokenId] = useState(true)

  // Whether to disable input while sending transaction
  const [isLoading, setIsLoading] = useState(false)

  // Handle name change
  const onNameChange = event => {
    setEnsName(event.target.value)
    const hash = namehash.hash(ensName)
    console.log('Setting an NFT resolver for: ' + hash)
    setNameHelperText('The name to point at your NFT')
  }

  // Handle contract address input change
  const onContractChange = event => {
    setContractAddress(event.target.value)
    console.log('Contract address of NFT: ' + contractAddress)
    setContractAddressHelperText('The ERC721 Contract address')
  }

  const onTokenChange = event => {
    setTokenId(event.target.value)
    console.log('Token ID : ' + tokenId)
    setTokenIdHelperText('The unique ID of your NFT')
  }

  // Triggers a contract interaction to set a name
  const onSubmit = event => {
    event.preventDefault();
    console.log('Setting  resolver for: ' + ensName)
    setIsLoading(true)
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

