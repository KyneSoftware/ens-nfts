import MetaMaskOnboarding from '@metamask/onboarding';
import React from 'react';
import { Typography, Button, makeStyles, Avatar } from '@material-ui/core';
import { MetaMaskIcon } from './metaMaskIcon';

const ONBOARD_TEXT = 'Click here to install MetaMask';
const CONNECT_TEXT = 'Connect Metamask';
const CONNECTED_TEXT = 'Metamask Connected';

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
  button: {
    margin: theme.spacing(1, 0, 2),
    backgroundColor: '#2E4057',
  }
}));

export default function MetamaskOnboarding() {
  const [buttonText, setButtonText] = React.useState(ONBOARD_TEXT);
  const [isDisabled, setDisabled] = React.useState(false);
  const [accounts, setAccounts] = React.useState([]);
  const onboarding = React.useRef();

  // Instantiate onboarding object
  React.useEffect(() => {
    if (!onboarding.current) {
      onboarding.current = new MetaMaskOnboarding();
    }
  }, []);

  // Is metamask installed
  React.useEffect(() => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      if (accounts.length > 0) {
        setButtonText(CONNECTED_TEXT);
        setDisabled(true);
        onboarding.current.stopOnboarding();
      } else {
        setButtonText(CONNECT_TEXT);
        setDisabled(false);
      }
    }
  }, [accounts]);

  // If metamask is installed, request access to the accounts in it
  // If metamask is disconnected, drop the accounts
  React.useEffect(() => {
    function handleNewAccounts(newAccounts) {
      setAccounts(newAccounts);
    }
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      const { ethereum } = typeof window !== `undefined` ? window : null
      ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(handleNewAccounts);
      ethereum.on('accountsChanged', handleNewAccounts);
      return () => {
        ethereum.off('accountsChanged', handleNewAccounts);
      };
    }
  }, []);

  // If the Connect to metamask button is clicked, begin to connect to accounts. 
  const onClick = () => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      const { ethereum } = typeof window !== `undefined` ? window : null
      ethereum
        .request({ method: 'eth_requestAccounts' })
        .then((newAccounts) => setAccounts(newAccounts));
    } else {
      onboarding.current.startOnboarding();
    }
  };
  const classes = useStyles();
  return (
    <div className={classes.paper}>
      {
        !isDisabled &&
        <Avatar className={classes.avatar}>
          <MetaMaskIcon />
        </Avatar>
      }
      <Button fullWidth
        variant="contained"
        color="primary"
        disabled={isDisabled}
        className={classes.button}
        onClick={onClick}>
        <Typography>
          {buttonText}
        </Typography>
      </Button>
    </div>
  );
}
