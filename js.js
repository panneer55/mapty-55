
///////////////////////////////////////
// APPLICATION ARCHITECTURE--SELECT THE ELEMENT

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    // clicks = 0;
  
    constructor(coords, distance, duration) {
      this.coords = coords; // [lat, lng]
      this.distance = distance; // in km
      this.duration = duration; // in min
    }
  
    _setDescription() {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
        months[this.date.getMonth()]
      } ${this.date.getDate()}`;
    }
  
    // click() {
    //   this.clicks++;
    // }
  }
  
  class Running extends Workout {
    type = 'running';
  
    constructor(coords, distance, duration, cadence) {
      super(coords, distance, duration);
      this.cadence = cadence;
      this.calcPace();
      this._setDescription();
    }
  
    calcPace() {
      // min/km
      this.pace = this.duration / this.distance;
      return this.pace;
    }
  }
  
  class Cycling extends Workout {
    type = 'cycling';
  
    constructor(coords, distance, duration, elevationGain) {
      super(coords, distance, duration);
      this.elevationGain = elevationGain;
      this.calcSpeed();
      this._setDescription();
    }
  
    calcSpeed() {
      // km/h
      this.speed = this.distance / (this.duration / 60);
      return this.speed;
    }
  }


////Create App 

class App {
   map;
   mapEvent;
   mapZoomLevel = 13;
   workouts = [];
    constructor(){
        this.getCoOrds();
        // Reload the old Data From local Storage
        this.getLocalStorage();
        //Attach Event handlers
        form.addEventListener('submit', this.newWorkout.bind(this));
        inputType.addEventListener('change',this.elevationToggle);
        containerWorkouts.addEventListener('click', this.moveToPopup.bind(this));
    
    }
    getCoOrds(){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this.loadPosistion.bind(this),function(){
                alert("Could not get your Posistion");
            });
        }
    }
    loadPosistion(e){
        const {latitude} = e.coords;
        const {longitude} = e.coords;
            this.map = L.map('map').setView([latitude, longitude], this.mapZoomLevel);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.map);
            this.map.on('click',this.showForm.bind(this));
        }

    ///////////Show Form//////////////////////////////

     showForm(mapE){
        this.mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
     }
     /////Hide form ///////////////////
     hideForm() {
      // Empty inputs
      inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
      form.style.display = 'none';
      form.classList.add('hidden');
      setTimeout(() => (form.style.display = 'grid'), 5000);
    }
     elevationToggle(){

         inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
         inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
     }
     newWorkout(e){
         e.preventDefault();
        //  Check the Valid Input /////
         const validInputs = (...inputs)=>inputs.every(input=> Number.isFinite(input));
          // Check All are Positive ///
         const allPositive = (...inputs) => inputs.every(inp => inp > 0);


         //Collect Data from form
         const type = inputType.value;

         const duration = +inputDuration.value;
         const { lat, lng } = this.mapEvent.latlng;
         let workout;
         const distance = +inputDistance.value;

         // Running    /////////
         if(type ==='running'){
            const cadence = +inputCadence.value;
             if(!validInputs(distance, duration, cadence) ||
             !allPositive(distance, duration, cadence)){
                return alert('Inputs have to be positive numbers!');
             }
             workout =new Running([lat, lng], distance, duration, cadence);
        }

        // Cycling    //////
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (
              !validInputs(distance, duration, elevation) ||
              !allPositive(distance, duration)
            )
              return alert('Inputs have to be positive numbers!');
      
            workout = new Cycling([lat, lng], distance, duration, elevation);
          }
          // Add new object to workout array

          this.workouts.push(workout);
          // Render workout on map as marker

          this.renderWorkoutMarker(workout);

          // Render workout on list
          this.renderWorkout(workout);
          
          //Hide form
          this.hideForm();

          // Set local storage to all workouts
          this.setLocalStorage();
      
     }


     renderWorkoutMarker(workout){

          L.marker(workout.coords)
          .addTo(this.map)
          .bindPopup(L.popup({
              maxWidth : 250,
              minWidth : 150,
              autoClose : false,
              closeOnClick : false,
              className : `${workout.type}-popup`
          }))
          .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
          .openPopup();
 }
    renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }
  setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }

  getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    
    if (!data) return;
    if(confirm('Are you want to clear Old Data')){
      this.reset1();
      return;
    }

    this.workouts = data;
    this.workouts.forEach(work => {
      this.renderWorkoutMarker(work)})

    this.workouts.forEach(work => {
      this.renderWorkout(work);
    });
  }
  moveToPopup(e) {
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    if (!this.map) return;

    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.map.setView(workout.coords, this.mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  reset1() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();