const React = require('react');
const ReactDOM = require('react-dom');

class App extends React.Component {
  constructor(){
    super();
    this.state={
      query: '',
      locations: [],
//       User ids and the location ids
      visitors: [],
//       Google Places API key.
      placesKey: 'AIzaSyCTEn3-pKBh2gP0xvq4Spzl_N0OKtksEkQ',
      userId: null
    }
    this.handleChange=this.handleChange.bind(this);
    this.handleSubmit=this.handleSubmit.bind(this);
    this.handleAttend=this.handleAttend.bind(this);
  }
  componentDidMount(){
          console.log('componentDidMount state',this.state)
        // Get visitor list.
    fetch('/api/visitors')
    .then(res=>res.json())
    .then(data=>{
      this.setState({visitors: data.visitors, userId:data.userId||null})
      // If user logged in check localStorage for query.
 if(this.state.userId){
     // If query is in localStorage, set query in state.
    const query=localStorage.getItem('query');
    if(query){
      this.setState({query: query});
      console.log('line 33',this.state)
         // If user logged in and query from localStorage set, search.
      this.handleSubmit()
    }
 }
    })
       

  }
  handleChange(event){
    this.setState({query: event.target.value});
  }
  handleSubmit(event){
 
    // Define cors bypass url.
    const cors='https://cors-anywhere.herokuapp.com/';
    console.log('Searching for locations in '+ this.state.query)
//     use google places to fetch coordinates from string search
    fetch(`${cors}https://maps.googleapis.com/maps/api/place/textsearch/json?query=${this.state.query}&key=${this.state.placesKey}`)
    .then(res=>res.json())
    .then(data=>{
      console.log(data.results[0].geometry.location)
      const coords=data.results[0].geometry.location;
      //     fetch restaraunts from coordinates
    const url = `${cors}https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coords.lat},${coords.lng}&radius=1500&type=restaurant&key=${this.state.placesKey}`;
    fetch(url)
      .then(res=>res.json())
      .then(data=>{
//       If user has signed in save query to local storage.
      if(this.state.userId){
      localStorage.setItem('query', this.state.query)
        console.log('Query saved to local storage.')
      }
      this.setState({locations:data.results})
    });
    })
    console.log('state:',this.state)
    console.log('localStorage:',localStorage)
        if(event){
      event.preventDefault();
    } 
  }
  handleAttend(venueId){
    if(this.state.userId){
     //     Get visitors list.
    const visitors = this.state.visitors;
//     Create visitors log.
    const doc = {venueId: venueId, userId: this.state.userId}
    console.log('doc',doc)
    const logCheck = visitors.find(l=>l.venueId===doc.venueId&&l.userId===doc.userId)
    console.log('log is present?',logCheck)
    if(logCheck){
      console.log('Delete reservation.')
      const updatedLogs = visitors.filter(log=>{
        if(log.venueId!==doc.venueId){
          return log;
        }
      })
         fetch('/api/visitors', {
           method: 'DELETE', 
           body: JSON.stringify({venueId: venueId}),
           headers: new Headers({'Content-Type': 'application/json'})
         })
           .then(res => res.text())
           .then(response => {
             console.log(response)
             //     Update log state if successful.
             this.setState({visitors: updatedLogs})
         });
    } 
    else {
      console.log('Save reservation.')
         fetch('/api/visitors', {
     method: 'POST', 
     body: JSON.stringify(doc),
     headers: new Headers({'Content-Type': 'application/json'})
   })
     .then(res => res.json())
     .then(response => {
         //     Update log state if successful.
    this.setState({visitors:visitors.concat(response.data)})
   });

    }
    } 
    else {
    window.location='/login';
    }
  }
  render(){

    return (
      <div id="app">
        <h1 className="app__header">Venues App</h1>
        <form onSubmit={this.handleSubmit} className="form">
          <input placeholder="Where are you?" onChange={this.handleChange} className="form__input" value={this.state.query} required/>
          </form>
        <div className="form__results">
          {this.state.locations.map(location=>{
            const visitors=this.state.visitors.filter(l=>l.venueId===location.id).length;
            return (
                      <div className="results__result clearfix" key={location.id}>
            <div className="result__details">
              <div className="details__name">{location.name} 
                {location.opening_hours&&location.opening_hours.open_now?
                  <span className="details-availability">Open</span>:''}
              </div>
              <div className="details__rating">{'⭐'.repeat(Math.round(location.rating))}</div>
              <div className="details__vicinity">{location.vicinity}</div>
              <div className="details__attend">
                <button className="attend__button" onClick={()=>this.handleAttend(location.id)}>{visitors} Attending</button>
              </div>
            </div>
          </div>
            )
          })}
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);