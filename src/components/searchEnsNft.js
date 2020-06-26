/**
 * Search ENS NFT component that queries connected Ethereum service for an existing NFT pointed to by this name
 */

import React, { useState } from "react"
import { Grid, TextField, Button, makeStyles, Avatar, Typography } from "@material-ui/core"
import ExploreIcon from '@material-ui/icons/Explore';

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
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
  },
}));



export default function SearchEns() {
  const [searchValue, setSearchValue] = useState('')
  const [helperText, setHelperText] = useState('Search for an NFT by name')
  const [validEnsName, setValidEnsName] = useState(true)

  const onChange = event => {
    setSearchValue(event.target.value)
    console.log('Searching for : ' + searchValue)
    setHelperText('Not a valid ENS name')
  }

  const onSubmit = event => {
    event.preventDefault();
    console.log('Searching for ENS NFT: ' + searchValue)
    setHelperText('Cool name')
    setValidEnsName(false)
  }

  const classes = useStyles();
  return (
    <div className={classes.paper}>
      <Avatar className={classes.avatar}>
        <ExploreIcon />
      </Avatar>
      <Typography component="h1" variant="h5">
        Search for a named NFT
      </Typography>
      <form className={classes.form} noValidate onSubmit={onSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              onChange={onChange}
              helperText={helperText}
              error={!validEnsName}
              name="ensName"
              variant="outlined"
              required
              fullWidth
              id="ensName"
              value={searchValue}
              label="ENS Name"
            // InputLabelProps={{
            //   shrink: true,
            // }}
            />
          </Grid>
        </Grid>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          className={classes.submit}
        >
          Lookup NFT
      </Button>
      </form>
    </div>
  )
}

