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


const styles = (theme) => ({
  avatar: {
    backgroundColor: 'midnightblue',
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
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();


  const handleConfirm = () => {
    setConfirmClicked(true);
  };

  useEffect(()=>{
    if(confirmClicked){
      console.log(`Confirm Clicked, time to trigger transactions.`)
      enqueueSnackbar(`Setting resolver for ${props.ensName}`, {
        variant: 'default',
      })

    }
    
    return ()=>{
      setConfirmClicked(false)
    }
  }, [confirmClicked])

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
                <Avatar className={classes.avatar}><DescriptionOutlinedIcon fontSize="small"/></Avatar>
                </ListItemAvatar>
              <ListItemText secondary="NFT Contract Address">{props.contractAddress}</ListItemText>
            </ListItem>
            <ListItem>
              <ListItemAvatar>
                <Avatar className={classes.avatar}><NftIcon fontSize="small"/></Avatar></ListItemAvatar>
              <ListItemText secondary="Token ID">{props.tokenId}</ListItemText>
            </ListItem>
          </List>
          <Alert severity="info">This action will launch two Metamask transactions. One to set your name to point at an ERC2381-ready resolver contract, and another to set this resolver to resolve the name {props.ensName}{" "} to the above details. <b>This will overwrite anything currently addressed by this name.</b></Alert>
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