// This is the Dialog Modal that pops up asking a user to confirm the name setting they are about to do with Metamask
import React, { useEffect, useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import Button from '@material-ui/core/Button';
import clsx from 'clsx';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import InsertDriveFileOutlined from '@material-ui/icons/InsertDriveFileOutlined';
import SendIcon from '@material-ui/icons/Send';
import DoneIcon from '@material-ui/icons/Done';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import Typography from '@material-ui/core/Typography';
import { ListItem, List, ListItemText, ListItemAvatar, Avatar, CircularProgress, ListItemSecondaryAction } from '@material-ui/core';
import { NftIcon } from './NftIcon';
import { useSnackbar } from 'notistack';
import { getResolver, checkResolverSupportsInterface, setResolver, setAddr, getAddr, getTokenId, setTokenId } from '../services/ens';
import { grey, green, red } from '@material-ui/core/colors';
import { logger } from '../config/pino';

const styles = (theme) => ({
  avatar: {
    backgroundColor: '#000000',
    color: '#f6c26c',
    width: theme.spacing(4),
    height: theme.spacing(4),
  },
  root: {
    margin: 0,
    padding: theme.spacing(2),
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  wrapper: {
    margin: theme.spacing(1),
    position: 'relative',
  },
  // Button styles are for transaction sending buttons that change colour dependent on success
  button: {
    // margin: theme.spacing(8, 0, 2),
    width: "100%",
    backgroundColor: '#000000',
  },
  buttonSuccess: {
    backgroundColor: green[500],
    '&:hover': {
      backgroundColor: green[700],
    },
  },
  buttonFailed: {
    backgroundColor: red[500],
    '&:hover': {
      backgroundColor: red[700],
    },
  },
  buttonProgress: {
    color: grey[500],
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
});

const DialogTitle = withStyles(styles)((props) => {
  const { children, classes, onClose, ...other } = props;
  return (
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

const DialogContent = withStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
}))(MuiDialogContent);

const DialogActions = withStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1),
  },
}))(MuiDialogActions);



const SetNameDialog = withStyles(styles)((props) => {
  const { classes, open, onClose } = props;
  // boolean triggered when a resolver set button is clicked
  const [resolverClicked, setResolverClicked] = useState(false);
  // React state that will hold the progress of the set resolver tx.
  const [resolverTxInProgress, setResolverTxInProgress] = useState(false);
  // The state that tracks the success of the resolver tx.
  const [resolverTxSucceeded, setResolverTxSucceeded] = useState(false);
  // The state that tracks if the resolver tx failed
  const [resolverTxFailed, setResolverTxFailed] = useState(false);
  // The address and token effects need access to the resolver contract address, set it in state when we get it once
  const [resolverAddress, setResolverAddress] = useState("");

  // boolean triggered when address set button is clicked
  const [addressClicked, setAddressClicked] = useState(false);
  // React state that will hold the progress of the set address tx.
  const [addressTxInProgress, setAddressTxInProgress] = useState(false);
  // The state that tracks the success of the address tx.
  const [addressTxSucceeded, setAddressTxSucceeded] = useState(false);
  // The state that tracks if the address tx failed
  const [addressTxFailed, setAddressTxFailed] = useState(false);

  // boolean triggered when address set button is clicked
  const [tokenClicked, setTokenClicked] = useState(false);
  // React state that will hold the progress of the set address tx.
  const [tokenTxInProgress, setTokenTxInProgress] = useState(false);
  // The state that tracks the success of the address tx.
  const [tokenTxSucceeded, setTokenTxSucceeded] = useState(false);
  // The state that tracks if the address tx failed
  const [tokenTxFailed, setTokenTxFailed] = useState(false);
  
  // If this name already has a resolver contract set, and this resolver contract supports EIP2381, we can skip the first 
  // transaction that calls the ENS registry to update the linked resolver contract.
  const [resolverSupportsEip2381, setResolverSupportsEip2381] = useState(false);
  // If this resolver contract already supports EIP2381, and it has the contract address set (both could happen off-app), no need to execute transaction 2, setAddress. 
  const [ contractAddressSet, setContractAddressSet] = useState(false);
  // If the resolver already supports EIP2381, check if the tokenID field is already set to what we want it to be
  const [ tokenIdSet, setTokenIdSet] = useState(false);

  // If the ENS name already points at the correct address, we can skip the second
  const { enqueueSnackbar } = useSnackbar();
  const timer = React.useRef();


  // Check if we are doing 1, 2 or 3 transactions in this modal depening on if the name points at a resolver
  // and whether that resolver supports EIP2381. 
  useEffect(() => {
    try {
      getResolver(props.ensName).then((address) => {
        console.log(`${props.ensName} does have a resolver contract set. ${address}`)
        setResolverAddress(address)
        checkResolverSupportsInterface(address, '0x4b23de55').then((supported) => {
          if (!!supported) {
            console.log(`${props.ensName} has a resolver set: ${address}, and it does support EIP 2381: ${supported.toString()}`)
            setResolverSupportsEip2381(true)
            // Given the right resolver is set, check if `addr` is set to the target contract address.
            getAddr(props.ensName).then((addr)=>{
              console.log(`Resolver 'addr' field already points at: ${addr}, we want to set it to: ${props.contractAddress}. Do they match? ${(addr == props.contractAddress).toString()}`)
              if(addr.toLowerCase() === props.contractAddress.toLowerCase()) {
                setContractAddressSet(true)
              }
              else {
                console.log('Updating this name to point at a new address than the one currently set')
                setContractAddressSet(false)
              }
            }).catch((err)=>{
              setContractAddressSet(false)
            })

            // Given an EIP2381 resolver, check if tokenId is what we want it to be
            getTokenId(props.ensName, address).then((tokenId)=>{
              console.log(`Resolver tokenId currently points at: ${tokenId}, we want to set it to: ${props.tokenId}`)
              if(tokenId === props.tokenId) {
                setTokenIdSet(true)
              }
              else {
                console.log('Updating this name to point at a new tokenId than the one currently set')
                setTokenIdSet(false)
              }
            }).catch((err)=>{
              console.error(`Exception thrown getting tokenId set for ${props.ensName} at resolver contract: ${address}`)
              console.error(err)
              setTokenIdSet(false)
            })
          } else {
            console.log(`${props.ensName} does not have a resolver set: ${address}, and it does not support EIP 2381: ${supported.toString()}`)
            setResolverSupportsEip2381(false)
          }
        })
      })
    } catch (e) {
      console.error(`There was trouble checking if ${props.ensName} has an EIP2381 resolver set.`)
      console.error(e)
    }
    return () => { }
  }, [props.open, props.ensName])

  // Effect that launches the metamask tranasction `SetResolver`. 
  useEffect(() => {
    if (resolverClicked) {
      console.log(`SetResolver Clicked, time to trigger transaction.`)
      enqueueSnackbar(`Setting resolver for ${props.ensName}`, {
        variant: 'default',
      })
      setResolver(props.ensName).then((response) => {
        console.log('Setting the resolver has returned')
        enqueueSnackbar(`${props.ensName} resolver set`, {
          variant: 'success',
        })
        setResolverTxSucceeded(true)
        setResolverTxFailed(false)
      }).catch((err) => {
        console.error('There was an issue setting the resolver contract for this name')
        console.log(err)
        enqueueSnackbar(`Failed to set resolver for ${props.ensName}`, {
          variant: 'error',
        })
        setResolverTxFailed(true)
        setResolverTxSucceeded(false)
      })
    } else {
      // This fires when something other than resolverClicked updates in the effect dependencies, we don't want to action on it right now
    }
    return () => {
      setResolverClicked(false)
      setResolverTxInProgress(false)
    }
  }, [resolverClicked, resolverTxInProgress, enqueueSnackbar, props.ensName])

  // Effect that launches the metamask tranasction `setAddr`. 
  useEffect(() => {
    if (addressClicked) {
      console.log(`addressClicked, time to trigger transaction.`)
      enqueueSnackbar(`Setting address for ${props.ensName}`, {
        variant: 'default',
      })
      setAddr(props.ensName, props.contractAddress).then(() => {
        console.log('Setting the address has returned')
        enqueueSnackbar(`${props.ensName} address set`, {
          variant: 'success',
        })
        setAddressTxSucceeded(true)
        setAddressTxFailed(false)
      }).catch((err) => {
        console.error('There was an issue setting the address for this name')
        console.log(err)
        enqueueSnackbar(`Failed to set address for ${props.ensName}`, {
          variant: 'error',
        })
        setAddressTxFailed(true)
        setAddressTxSucceeded(false)
      })
    } else {
      // This fires when something other than addressClicked updates in the effect dependencies, we don't want to action on it right now
    }
    return () => {
      setAddressClicked(false)
      setAddressTxInProgress(false)
    }
  }, [addressClicked, addressTxInProgress, enqueueSnackbar, props.ensName])

  // Effect that launches the metamask tranasction `setTokenID`. 
  useEffect(() => {
    if (tokenClicked) {
      console.log(`tokenClicked, time to trigger transaction.`)
      enqueueSnackbar(`Setting token ID for ${props.ensName}`, {
        variant: 'default',
      })
      setTokenId(props.ensName, props.tokenId, resolverAddress).then(() => {
        console.log('Setting the tokenID has returned')
        enqueueSnackbar(`${props.ensName} token ID set`, {
          variant: 'successs',
        })
        setTokenTxSucceeded(true)
        setTokenTxFailed(false)
      }).catch((err) => {
        console.error('There was an issue setting the token for this name')
        console.log(err)
        enqueueSnackbar(`Failed to set token ID for ${props.ensName}`, {
          variant: 'error',
        })
        setTokenTxFailed(true)
        setTokenTxSucceeded(false)
      })
    } else {
      // This fires when something other than tokenClicked updates in the effect dependencies, we don't want to action on it right now
    }
    return () => {
      setTokenClicked(false)
      setTokenTxInProgress(false)
    }
  }, [tokenClicked, tokenTxInProgress, enqueueSnackbar, props.ensName])

  const handleSetResolverClick = () => {
    setResolverClicked(true)
    setResolverTxInProgress(true)
  };

  const handleSetAddressClick = () => {
    setAddressClicked(true)
    setAddressTxInProgress(true)
  };

  const handleSetTokenClick = () => {
    setTokenClicked(true)
    setTokenTxInProgress(true)
  };

  const buttonClassname = clsx({
    [classes.button]: true,
    [classes.buttonSuccess]: resolverTxSucceeded,
    [classes.buttonFailed]: resolverTxFailed
  });

  React.useEffect(() => {
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  return (
    <div>
      <Dialog onClose={onClose} aria-labelledby="customized-dialog-title" open={open}>
        <DialogTitle id="customized-dialog-title" onClose={onClose}>
          You have 
          {" " + [!resolverSupportsEip2381, !contractAddressSet, !tokenIdSet].filter(Boolean).length.toString() + " "}
           transaction
           {([!resolverSupportsEip2381, !contractAddressSet, !tokenIdSet].filter(Boolean).length !== 1) ? "s " : " "} 
           to send
        </DialogTitle>
        <DialogContent dividers>
          <List>
            <ListItem button disabled={resolverTxInProgress || resolverSupportsEip2381} onClick={handleSetResolverClick}>
              <ListItemAvatar >
                <Avatar className={classes.avatar}><InsertDriveFileOutlined fontSize="small" /></Avatar>
              </ListItemAvatar>
              <ListItemText secondary={`Tell ENS what contract manages ${props.ensName}`}>
              {!resolverTxInProgress && !resolverSupportsEip2381 &&<div><b>1.</b> Set a resolver contract</div>}
              {resolverTxInProgress && <div><b>1.</b> Setting resolver</div>}
              {resolverSupportsEip2381 && <div><b>1.</b> Resolver supports NFTs</div>}
              </ListItemText>
              {resolverTxInProgress && <CircularProgress  className={classes.buttonProgress} />}
              {!resolverTxInProgress && !resolverSupportsEip2381 && !resolverTxSucceeded && <SendIcon color={'secondary'} />}
              {!resolverTxInProgress && (resolverSupportsEip2381 || resolverTxSucceeded) && <DoneIcon color={'secondary'} />}
            </ListItem>
            <ListItem button disabled={addressTxInProgress || contractAddressSet } onClick={handleSetAddressClick}>
              <ListItemAvatar >
                <Avatar className={classes.avatar}><DescriptionOutlinedIcon fontSize="small" /></Avatar>
              </ListItemAvatar>
              <ListItemText secondary={`Send ENS lookups for ${props.ensName} to this address`}>
              {!addressTxInProgress && !contractAddressSet && !addressTxSucceeded && <div><b>2.</b> Set the resolver to point at the contract address</div>}
              {addressTxInProgress && <div><b>2.</b> Setting address</div>}
              {(contractAddressSet || addressTxSucceeded) && !addressTxInProgress && <div><b>2.</b> Contract Address Set</div>}
                
              </ListItemText>
              {addressTxInProgress && <CircularProgress  className={classes.buttonProgress} />}
              {!addressTxInProgress && !addressTxSucceeded && !contractAddressSet && <SendIcon color={'secondary'} />}
              {!addressTxInProgress && ( addressTxSucceeded || contractAddressSet ) && <DoneIcon color={'secondary'} />}
            </ListItem>
            <ListItem button disabled={tokenTxInProgress || tokenIdSet } onClick={handleSetTokenClick}>
              <ListItemAvatar>
                <Avatar className={classes.avatar}><NftIcon fontSize="small" /></Avatar></ListItemAvatar>
              <ListItemText secondary="Highlight the specifc NFT you had in mind">
              {!tokenTxInProgress && !tokenIdSet && !tokenTxSucceeded && <div><b>3.</b> Set the token ID field for {props.ensName}</div>}
              {tokenTxInProgress && <div><b>3.</b> Setting token ID</div>}
              {(tokenTxSucceeded || tokenIdSet) && <div><b>3.</b> Token ID Set</div>}
              </ListItemText>
              {tokenTxInProgress && <CircularProgress  className={classes.buttonProgress} />}
              {!tokenTxInProgress && !tokenTxSucceeded && !tokenIdSet && <SendIcon color={'secondary'} />}
              {!tokenTxInProgress && (tokenTxSucceeded || tokenIdSet) && <DoneIcon color={'secondary'} />}
            </ListItem>
          </List>
          {!resolverSupportsEip2381 && <Alert severity="info">The above buttons will launch three Metamask transactions. One to set your name to point at an ERC2381-ready resolver contract, and two to set this resolver to resolve the name <b>{props.ensName}</b>{" "} to {props.contractAddress}:{props.tokenId}. <b>This will overwrite anything currently addressed by this name.</b></Alert>}
          {resolverSupportsEip2381 && <Alert severity="info">The above buttons will launch Metamask transactions to set this resolver to resolve the name <b>{props.ensName}</b>{" "} to the above details. <b>This will overwrite anything currently addressed by this name.</b></Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});
export default SetNameDialog;