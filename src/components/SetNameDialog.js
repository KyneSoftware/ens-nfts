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
import { getResolver, checkResolverSupportsInterface, setResolver } from '../services/ens';
import { grey, green, red } from '@material-ui/core/colors';



const SET_RESOLVER_TEXT_DEFAULT = "Set Resolver"
const SET_RESOLVER_TEXT_IN_PROGRESS = "Setting Resolver"
const SET_RESOLVER_TEXT_SUCCESS = "Resolver Set"
const SET_RESOLVER_TEXT_FAILED = "Transaction Failed"

const styles = (theme) => ({
  avatar: {
    backgroundColor: '#2E4057',
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
    backgroundColor: '#2E4057',
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
  const [confirmClicked, setConfirmClicked] = useState(false);
  //
  const [resolverTxButtonText, setResolverTxButtonText] = useState(SET_RESOLVER_TEXT_DEFAULT)
  // React state that will hold the progress of the set resolver tx.
  const [resolverTxInProgress, setResolverTxInProgress] = useState(false);
  // The state that tracks the success of the resolver tx.
  const [resolverTxSucceeded, setResolverTxSucceeded] = useState(false);
  // The state that tracks if the resolver tx failed
  const [resolverTxFailed, setResolverTxFailed] = useState(false);
  
  // If this name already has a resolver contract set, and this resolver contract supports EIP2381, we can skip the first 
  // transaction that calls the ENS registry to update the linked resolver contract.
  const [resolverSupportsEip2381, setResolverSupportsEip2381] = useState(true);

  // If the ENS name already points at the correct address, we can skip the second
  const { enqueueSnackbar } = useSnackbar();
  const timer = React.useRef();


  // Check if we are doing 1, 2 or 3 transactions in this modal depening on if the name points at a resolver
  // and whether that resolver supports EIP2381. 
  useEffect(() => {
    try {
      getResolver(props.ensName).then((address) => {
        console.log(`${props.ensName} does have a resolver contract set. ${address}`)
        checkResolverSupportsInterface(address, '0x4b23de55').then((supported) => {
          if (!!supported) {
            console.log(`${props.ensName} has a resolver set: ${address}, and it does support EIP 2381: ${supported.toString()}`)
            setResolverSupportsEip2381(true)
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

  // Effect that launches the metamask tranasctions. 
  useEffect(() => {
    if (confirmClicked) {
      console.log(`Confirm Clicked, time to trigger transactions.`)
      enqueueSnackbar(`Setting resolver for ${props.ensName}`, {
        variant: 'default',
      })
      setResolver(props.ensName).then((response) => {
        console.log('Setting the resolver has returned, next we will set the address and tokenId fields on the new resolver.')
        enqueueSnackbar(`Setting ${props.ensName} to contract address`, {
          variant: 'default',
        })
      }).catch((err) => {
        console.error('There was an issue setting the resolver contract for this name')
        console.log(err)
        enqueueSnackbar(`Failed to set resolver for ${props.ensName}`, {
          variant: 'error',
        })
      })
    } else {

    }

    return () => {
      setConfirmClicked(false)
    }
  }, [confirmClicked, enqueueSnackbar, props.ensName])

  const handleConfirm = () => {
    setConfirmClicked(true);
  };

  const handleSetResolverClick = () => {
    if (!resolverTxInProgress) {
      setResolverTxSucceeded(false);
      setResolverTxInProgress(true);
      setResolverTxButtonText(SET_RESOLVER_TEXT_IN_PROGRESS)
      timer.current = window.setTimeout(() => {
        setResolverTxSucceeded(true);
        setResolverTxInProgress(false);
        setResolverTxButtonText(SET_RESOLVER_TEXT_SUCCESS)
        setResolverTxFailed(true);
        setResolverTxInProgress(false);
        setResolverTxButtonText(SET_RESOLVER_TEXT_FAILED)
      }, 2000);
    }
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
          You have 3 transactions to send
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
              {resolverSupportsEip2381 && <div><b>1.</b> Resolver set</div>}
              </ListItemText>
              {resolverTxInProgress && <CircularProgress  className={classes.buttonProgress} />}
              {!resolverTxInProgress && !resolverSupportsEip2381 && <SendIcon color={'secondary'} />}
              {!resolverTxInProgress && resolverSupportsEip2381 && <DoneIcon color={'secondary'} />}
            </ListItem>
            <ListItem button >
              <ListItemAvatar >
                <Avatar className={classes.avatar}><DescriptionOutlinedIcon fontSize="small" /></Avatar>
              </ListItemAvatar>
              <ListItemText secondary={`Send ENS lookups for ${props.ensName} to this address`}><b>2.</b> Set the resolver to point at the contract address</ListItemText>
              <SendIcon color={'secondary'} />
            </ListItem>
            <ListItem button>
              <ListItemAvatar>
                <Avatar className={classes.avatar}><NftIcon fontSize="small" /></Avatar></ListItemAvatar>
              <ListItemText secondary="Highlight the specifc NFT you had in mind"><b>3.</b> Set the token ID field for {props.ensName}</ListItemText>
              <SendIcon color={'secondary'} />
            </ListItem>
          </List>
          {!resolverSupportsEip2381 && <Alert severity="info">The above buttons will launch three Metamask transactions. One to set your name to point at an ERC2381-ready resolver contract, and two to set this resolver to resolve the name <b>{props.ensName}</b>{" "} to {props.contractAddress}:{props.tokenId}. <b>This will overwrite anything currently addressed by this name.</b></Alert>}
          {resolverSupportsEip2381 && <Alert severity="info">This action will launch a Metamask transaction to set this resolver to resolve the name <b>{props.ensName}</b>{" "} to the above details. <b>This will overwrite anything currently addressed by this name.</b></Alert>}
          <div className={classes.wrapper}>
            <Button
              variant="contained"
              color="primary"
              className={buttonClassname}
              disabled={resolverTxInProgress}
              onClick={handleSetResolverClick}
            >
              {resolverTxButtonText}
            </Button>
            {resolverTxInProgress && <CircularProgress size={24} className={classes.buttonProgress} />}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirm} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});
export default SetNameDialog;