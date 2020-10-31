// This is the Dialog Modal that pops up asking a user to confirm the name setting they are about to do with Metamask
import React, { useEffect, useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import Typography from '@material-ui/core/Typography';
import { ListItem, List, ListItemText, ListItemAvatar, Avatar } from '@material-ui/core';
import { NftIcon } from './NftIcon';
import { useSnackbar } from 'notistack';
import { getResolver, checkResolverSupportsInterface, setResolver } from '../services/ens';


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
  const { children, classes, open, onClose, ...other } = props;

  const [confirmClicked, setConfirmClicked] = useState(false);
  // If this name already has a resolver contract set, and this resolver contract supports EIP2381, we can skip the first
  // transaction that calls the ENS registry to update the linked resolver contract.
  const [resolverSupportsEip2381, setResolverSupportsEip2381] = useState(true);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // Check if we are doing 1 or 2 transactions in this modal depening on if the name points at a resolver
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
    return () => {}
  }, [props.open])

  // Effect that launches the metamask tranasctions. 
  useEffect(() => {
    if (confirmClicked) {
      console.log(`Confirm Clicked, time to trigger transactions.`)
      enqueueSnackbar(`Setting resolver for ${props.ensName}`, {
        variant: 'default',
      })
      setResolver(props.ensName).then((response)=>{
        console.log('Setting the resolver has returned, next we will set the address and tokenId fields on the new resolver.')
        enqueueSnackbar(`Setting ${props.ensName} to contract address`, {
          variant: 'default',
        })
      }).catch((err) =>
      {
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
  }, [confirmClicked])

  const handleConfirm = () => {
    setConfirmClicked(true);
  };

  return (
    <div>
      <Dialog onClose={onClose} aria-labelledby="customized-dialog-title" open={open}>
        <DialogTitle id="customized-dialog-title" onClose={onClose}>
          Set <b>{props.ensName}{" "}</b> to point at this NFT?
        </DialogTitle>
        <DialogContent dividers>
          <List>
            <ListItem>
              <ListItemAvatar >
                <Avatar className={classes.avatar}><DescriptionOutlinedIcon fontSize="small" /></Avatar>
              </ListItemAvatar>
              <ListItemText secondary="NFT Contract Address">{props.contractAddress}</ListItemText>
            </ListItem>
            <ListItem>
              <ListItemAvatar>
                <Avatar className={classes.avatar}><NftIcon fontSize="small" /></Avatar></ListItemAvatar>
              <ListItemText secondary="Token ID">{props.tokenId}</ListItemText>
            </ListItem>
          </List>
          {!resolverSupportsEip2381 && <Alert severity="info">This action will launch two Metamask transactions. One to set your name to point at an ERC2381-ready resolver contract, and another to set this resolver to resolve the name <b>{props.ensName}</b>{" "} to the above details. <b>This will overwrite anything currently addressed by this name.</b></Alert>}
          {resolverSupportsEip2381 && <Alert severity="info">This action will launch a Metamask transaction to set this resolver to resolve the name <b>{props.ensName}</b>{" "} to the above details. <b>This will overwrite anything currently addressed by this name.</b></Alert>}

        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirm} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});
export default SetNameDialog;