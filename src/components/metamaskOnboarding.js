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
  // Triggered when the connect button is clicked, used to trigger the connect account react effect
  const [connectClicked, setConnectClicked] = React.useState(false);
  const [accounts, setAccounts] = React.useState([]);
  const onboarding = React.useRef();

  // Instantiate metamask onboarding object once connect clicked
  React.useEffect(() => {
    // Effects trigger when a variable changes, so connectClicked = true runs this once, 
    // and then when we toggle the value back off we don't want to run this logic a second time, so short circuit return early
    if (!connectClicked) {
      return
    }

    // Check if we have a reference to MetaMaskOnboarding or instantiate a new one

    if (MetaMaskOnboarding.isMetaMaskInstalled()) {

      // Callback that saves the permitted Eth accounts to react state
      function handleNewAccounts(newAccounts) {
        setAccounts(newAccounts);
      }
      console.log('Metamask already installed, requesting access')
      const { ethereum } = typeof window !== `undefined` ? window : null
      ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(handleNewAccounts);
      ethereum.on('accountsChanged', handleNewAccounts);
      return () => {
        ethereum.off('accountsChanged', handleNewAccounts);
      };

    }

    else if (!onboarding.current) {
      onboarding.current = new MetaMaskOnboarding();
      console.log('Metamask not installed, trigger onboarding flow. ')
      onboarding.current.startOnboarding();
    }

    console.log('Finishing metamask connect button click')
    setConnectClicked(false)

    // React effect runs each time connectClicked's value changes
  }, [connectClicked]);

  // Is metamask installed
  React.useEffect(() => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      if (accounts.length > 0) {
        // Looks good, grey out button and say "Connected"
        setButtonText(CONNECTED_TEXT);
        setDisabled(true);
        // Stop onboarding prompt if it's started
        if (!!onboarding.current) {
          onboarding.current.stopOnboarding();
        }
      } else {
        setButtonText(CONNECT_TEXT);
        setDisabled(false);
      }
    } else {
      console.log('Metamask is not installed allegedly. ')
    }
  }, [accounts]);

  // If metamask is installed, request access to the accounts in it
  // If metamask is disconnected, drop the accounts
  // React.useEffect(() => {
  //     function handleNewAccounts(newAccounts) {
  //         setAccounts(newAccounts);
  //     }
  //     if (MetaMaskOnboarding.isMetaMaskInstalled()) {
  //         const { ethereum } = typeof window !== `undefined` ? window : null
  //         ethereum
  //             .request({ method: 'eth_requestAccounts' })
  //             .then(handleNewAccounts);
  //         ethereum.on('accountsChanged', handleNewAccounts);
  //         return () => {
  //             ethereum.off('accountsChanged', handleNewAccounts);
  //         };
  //     }
  // }, []);

  // If the Connect to metamask button is clicked, begin to connect to accounts. 
  const onClick = () => {
    setConnectClicked(true)
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
