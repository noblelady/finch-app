import * as React from 'react';
import _ from 'lodash';
import './App.css';
import { PROVIDERS, PROXY_URL } from './constants';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, CircularProgress, FormControl, MenuItem, Dialog, DialogTitle, DialogActions, DialogContent, DialogContentText, Select, InputLabel, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function App() {
  const [provider, setProvider] = React.useState(PROVIDERS[0].id); //set the first provider id by default. to ensure there is no null value
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState(null);
  const [token, setToken] = React.useState("");
  const [errMsg, setErrMsg] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (event) => {
    setProvider(event.target.value);
  };

  const handleSubmit = () => {
    const finchURL = PROXY_URL + 'https://finch-sandbox-se-interview.vercel.app/api/sandbox/create';
    setLoading(true);
    fetch(finchURL, {
      method: 'POST',
      headers: {
        'dataType': 'json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'provider': provider,
        'products': ["company", "directory", "individual", "employment"]
      }),
      redirect: 'follow'
    })
    .then(response => response.json())
    .then(data => {
      setToken(data.access_token.toString());
      getEmploymentData(data.access_token.toString());
    })
    .catch(err => {
      setErrMsg('Sorry we are unable to fetch from sandbox/create');
      console.log(`ERROR: ${err}`);
      setOpen(true);
    });
  };

  const getEmploymentData = (bToken) => {
    const finchURL = PROXY_URL + 'https://finch-sandbox-se-interview.vercel.app/api/employer/directory',
          bearerToken = 'Bearer ' + bToken;
    fetch(finchURL, {
      headers: {
        'Authorization': bearerToken,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      setData(data.individuals);
      setLoading(false);
    })
    .catch(err => {
      console.log(`ERROR: ${err}`);
      setErrMsg('Sorry we are unable to fetch from /employer/directory');
      setOpen(true);
    });
  };

  const handleLoadEmployee = (event, id) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: `{"requests":[{"individual_id":"${id}"}]}`
    };

    let emData = [...data],
        finchURL = PROXY_URL + 'https://finch-sandbox-se-interview.vercel.app/api/employer/individual';
    //fetch personal data
    fetch(finchURL, options)
    .then(response => response.json())
    .then(data => {
      // filter out
      _.assign(emData[_.findIndex(emData,['id', id])], data.responses[0].body);
      setData(emData);
    })
    .catch(err => {
      console.log(`ERROR: ${err}`);
      setErrMsg('We were unable to fetch from /employer/individual.');
      setOpen(true);
    });

    finchURL = PROXY_URL + 'https://finch-sandbox-se-interview.vercel.app/api/employer/individual/employer/employment';
    //fetch employee data
    fetch(finchURL, options)
    .then(response => response.json())
    .then(data => {
      // get the index based off the id and merge it with the new data
      _.assign(emData[_.findIndex(emData,['id', id])], data.responses[0].body);
      setData(emData);
    })
    .catch(err => {
      console.log(`ERROR: ${err}`);
      setErrMsg('We were unable to fetch from /employer/employment.');
      setOpen(true);
    });
    //disable the button so it can't be spammed.
    event.currentTarget.classList.add('Mui-disabled');
  };

  return (
    <div className="App">
      <header className="App-header">
        <Box className='Provider-Selection'>
          <Typography variant='h3'>Choose a Provider</Typography>
          <FormControl variant="filled" className='Provider-Select'>
            <InputLabel id="demo-simple-select-label">Provider</InputLabel>
            <Select className='Provider-Select-selectbox' value={provider} label='Providers' onChange={handleChange}>
              { PROVIDERS.map( (provider) => {
                return <MenuItem key={provider.id} value={provider.id}>{provider.name}</MenuItem>
              })}
            </Select>
          </FormControl>
          <Button variant='contained'onClick={handleSubmit}>Submit</Button>
        </Box>
        {loading && <CircularProgress /> }
        <Box className='Provider-Employee_data'>
          <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">
              {"There was an issue!"}
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                {errMsg}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} autoFocus>
                Ok
              </Button>
            </DialogActions>
          </Dialog>
          {data !== null ? data.map((employee) => {
            return (
              <Accordion key={employee.id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant='h5'>{`${employee.first_name} ${employee.last_name}`}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>Department: {employee.department.name}</Typography>
                  <Typography>Activity: {employee.is_active ? 'Active' : 'Not Active'}</Typography>
                  {employee.dob && <Typography>Date of Birth: {employee.dob}</Typography>}
                  {employee.gender && <Typography>Gender: {employee.gender}</Typography>}
                  {employee.residence && <Typography>Residence: {employee.residence.line1} {employee.residence.line2} {employee.residence.city}, {employee.residence.state} {employee.residence.postal_code}</Typography>}
                  {employee.emails && <div>
                    <Typography>Email: </Typography>
                      <ul>
                      {employee.emails.map((email, index) => {
                        return <li key={'email-' + index}><Typography>{email.type} - {email.data}</Typography></li>
                      })}
                      </ul>
                    </div>}
                  {employee.phone_numbers && <div>
                  <Typography>Phone Numbers: </Typography>
                    <ul>
                    {employee.phone_numbers.map((phone, index) => {
                      return <li key={'phone-' + index}><Typography>{phone.type} - {phone.data}</Typography></li>
                    })}
                    </ul>
                  </div>}
                  <div>
                    <Button variant='contained' onClick={(event) => handleLoadEmployee(event, employee.id)}>Load more employee data</Button>
                  </div>
                </AccordionDetails>
              </Accordion>
            );
          })
        : <Typography className='centered' variant='h5'>No Results Currently</Typography>}
        </Box>
      </header>
    </div>
  );
}

export default App;
