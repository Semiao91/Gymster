function getCurrentDateTime() {
    const now = new Date();
    const options = { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric', 
        weekday: 'long', 
      };
      const dateTimeString = now.toLocaleString('en-US', options);
      return dateTimeString;
  }
  
const profileTripsDiv = document.querySelector('.profile-trips');
const dateTimeString = getCurrentDateTime();
const datetimeDiv = document.getElementById("dashboard-date");
const dateTitle = document.getElementById("tracker-title");
const deleteBtn = document.getElementById("delete-btn");
const lookingGood = document.getElementById("message-tip");
datetimeDiv.textContent = dateTimeString;


const exerciseInput = document.getElementById("exercise-input");
const submitBtn = document.getElementById("submit-btn");
const trackerDisplayContent = document.getElementById("tracker-display-content");


submitBtn.addEventListener("click", () => {
  const selectedExercise = exerciseInput.options[exerciseInput.selectedIndex].value;
  const selectedDateElement = document.querySelector(".selected");
  const selectedDate = selectedDateElement ? parseInt(selectedDateElement.textContent) : null;

  if (selectedExercise && selectedDate) {
    const selectedDateString = new Date(currYear, currMonth, selectedDate).toISOString();
    submitExercise(selectedDateString, selectedExercise);
    trackerDisplayContent.textContent = `You did ${selectedExercise} on this day`;
    
  }
});

const daysTag = document.querySelector(".days");
const currentDate = document.querySelector(".current-date");
const prevNextIcon = document.querySelectorAll(".icons span");

let date = new Date();
let currYear = date.getFullYear();
let currMonth = date.getMonth();

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const renderCalendar = async () => {
  const exercises = await fetchExercises(currMonth, currYear);
  const exerciseDates = exercises ? exercises.map((exercise) => new Date(exercise.date).getDate()) : [];
  let firstDayofMonth = new Date(currYear, currMonth, 1).getDay();
  let lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate();
  let lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay();
  let lastDateofLastMonth = new Date(currYear, currMonth, 0).getDate();
  let liTag = "";
  
  
  let checkmarkedDays = 0;

  for (let i = firstDayofMonth; i > 0; i--) {
    liTag += `<li class="inactive">${lastDateofLastMonth - i + 1}</li>`;
  }

  for (let i = 1; i <= lastDateofMonth; i++) {
    let isToday = i === date.getDate() && currMonth === new Date().getMonth() && currYear === new Date().getFullYear() ? "active" : "";
    let hasExercise = exerciseDates.includes(i) ? "exercise-stored" : "";
    liTag += `<li class="${isToday} ${hasExercise}" onclick="selectDate(this)">${i}</li>`;

   
    if (hasExercise) {
      checkmarkedDays++;
    }
  }

  for (let i = lastDayofMonth; i < 6; i++) {
    liTag += `<li class="inactive">${i - lastDayofMonth + 1}</li>`;
  }

  currentDate.innerText = `${months[currMonth]} ${currYear}`;
  daysTag.innerHTML = liTag;


  profileTripsDiv.textContent = checkmarkedDays;

  const progressPercentage = (checkmarkedDays / lastDateofMonth) * 100;
  const progressBar = document.querySelector('.visit .progress');
  progressBar.style.width = `${progressPercentage}%`;
}

renderCalendar();

prevNextIcon.forEach(icon => {
  icon.addEventListener("click", () => {
    currMonth = icon.id === "prev" ? currMonth - 1 : currMonth + 1;

    if(currMonth < 0 || currMonth > 11) {
      date = new Date(currYear, currMonth, new Date().getDate());
      currYear = date.getFullYear();
      currMonth = date.getMonth();
    } else {
      date = new Date();
    }

    renderCalendar();
  });
});




async function selectDate(element) {
  const selected = document.querySelector(".selected");
  if (selected) {
    selected.classList.remove("selected");
  }
  dateTitle.textContent = `You selected ${element.textContent} of ${months[currMonth]}`;
  element.classList.add("selected");

 
  const selectedDate = parseInt(element.textContent);
  const selectedDateString = new Date(currYear, currMonth, selectedDate).toISOString();
  const exercise = await fetchExercise(selectedDateString);

 
  if (exercise) {
    trackerDisplayContent.textContent = `You did ${exercise.type} on this day`;
    deleteBtn.classList.remove('hidden'); 
    submitBtn.classList.add('hidden'); 
  } else {
    trackerDisplayContent.textContent = '';
    deleteBtn.classList.add('hidden'); 
    submitBtn.classList.remove('hidden'); 
  }
}

async function submitExercise(date, exercise) {
  const response = await fetch('/api/submit-exercise', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date, exercise }),
  });

  if (response.ok) {
    const data = await response.json();
    showAlert('Exercise added successfully');
    updateUI(data.exercise);
  } else {
    showAlert('Error submiting exercise');
  }
  await renderCalendar();
  await updateMostSubmittedMuscleGroup();
  
}

function updateUI(exercise) {
  const selectedDay = document.querySelector('.selected');
  const trackerDisplayContent = document.getElementById('tracker-display-content');
  const deleteBtn = document.getElementById('delete-btn');

  if (selectedDay && exercise) {
    selectedDay.classList.add('exercise-stored');
    trackerDisplayContent.textContent = `You did ${exercise.type} on this day`;
    deleteBtn.classList.remove('hidden');
  } else {
    trackerDisplayContent.textContent = '';
    deleteBtn.classList.add('hidden');
    
  }
}

async function fetchExercise(date) {
  const response = await fetch(`/api/fetch-exercise?date=${date}`);

  if (response.ok) {
    const data = await response.json();
    return data.exercise;
  } else {
    console.error('Error fetching exercise.');
    return null;
  }
}

async function fetchExercises(month, year) {
  const response = await fetch(`/api/fetch-exercises?month=${month}&year=${year}`);

  if (response.ok) {
    const data = await response.json();
    return data.exercises;
  } else {
    console.error('Error fetching exercises.');
    return null;
  }
}

async function updateMostSubmittedMuscleGroup() {
  try {
    const response = await fetch('/api/most-submitted-muscle-group');
    const data = await response.json();
    const muscleGroup = data.muscleGroup;
    console.log(muscleGroup);
    const muscleGroupText = muscleGroup || 'N/A';

    document.getElementById('profile-favourite').innerText = `${muscleGroupText}`;
  } catch (error) {
    console.error('Error fetching most submitted muscle group:', error);
  }
}


async function fetchUserInfo() {
  try {
    const response = await fetch('/api/userinfo');
    if (response.status === 200) {
      const data = await response.json();
      console.log('User information:', data.user);
      return data.user; 
    } else {
      console.log('Error fetching user information:', response.status);
    }
  } catch (error) {
    console.error('Error fetching user information:', error);
  }
}


async function updateWelcomeMessage() {
  const userInfo = await fetchUserInfo();
  if (userInfo) {
    const welcomeMessageElement = document.getElementById('welcome-message');
    const profileName = document.getElementById('profile-name');
    profileName.textContent = `${userInfo.firstname} ${userInfo.lastname}`
    welcomeMessageElement.textContent = `Hello ${userInfo.firstname}`; 
  }
}

updateWelcomeMessage();
updateMostSubmittedMuscleGroup();

deleteBtn.addEventListener("click", async () => {
  const selectedDateElement = document.querySelector(".selected");
  const selectedDate = selectedDateElement ? parseInt(selectedDateElement.textContent) : null;

  if (selectedDate) {
    const selectedDateString = new Date(currYear, currMonth, selectedDate).toISOString();
    await deleteExercise(selectedDateString);
    await renderCalendar();
    await updateMostSubmittedMuscleGroup();
    trackerDisplayContent.textContent = '';
    deleteBtn.classList.add('hidden'); 
  }
});

async function deleteExercise(date) {
  const response = await fetch('/api/delete-exercise', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date }),
  });

  if (response.ok) {
    const data = await response.json();
    console.log(data.message);
    showAlert('Exercise deleted successfully');
  } else {
    console.error('Error deleting exercise.');
  }
}

document.getElementById('logout-btn').addEventListener('click', logout);

async function logout() {
  try {
    const response = await fetch('/logout', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
   
      window.location.href = '/login';
    } else {
      console.error('Logout failed:', response.statusText);
    }
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

async function checkLoginStatus() {
  try {
    const response = await fetch('/api/check-login', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
  
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Error checking login status:', error);
  }
}

checkLoginStatus();

  const editProfileButton = document.getElementById("edit-profile");
  const closeModalButton = document.getElementById("close-modal");
  const saveChangesButton = document.getElementById("save-changes");
  const modal = document.getElementById("edit-modal");

  
  editProfileButton.onclick = () => {
    modal.style.display = "block";
  };

 
  closeModalButton.onclick = () => {
    modal.style.display = "none";
  };

 
saveChangesButton.onclick = async () => {
  const height = document.getElementById("height").value;
  const weight = document.getElementById("weight").value;
  const age = document.getElementById("age").value;
  const oldWeight = parseFloat(document.querySelector(".profile-weight").textContent);

  if (height || weight || age) {
    try {
      const response = await fetch('/api/update-user-details', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ height, weight, age }),
      });

      if (response.ok) {
        const result = await response.json();

        document.querySelector(".profile-height").textContent = result.user.height + "m";
        document.querySelector(".profile-weight").textContent = result.user.weight + "kg";
        document.querySelector(".profile-age").textContent = result.user.age + "y";

        const newWeight = parseFloat(result.user.weight);
        const weightDifference = newWeight - oldWeight;
        renderWeightDifference(weightDifference);

        await saveWeightDifferenceGoal(weightDifference);

        modal.style.display = "none";
        showAlert("Profile updated successfully")
        updateProfileTitle();
      } else {
        const error = await response.json();
        console.error('Error updating user details:', error.message);
      }
    } catch (error) {
      console.error('Error updating user details:', error);
    }
  }
};

async function saveWeightDifferenceGoal(weightDifference) {
  try {
    const response = await fetch('/api/save-goal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ weightDifference }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error saving goal:', error.message);
    }
  } catch (error) {
    console.error('Error saving goal:', error);
  }
}

function renderWeightDifference(weightDifference) {
 
  const weightDifferenceElement = document.getElementById('profile-gains');


  const weightDifferenceText = weightDifference > 0 ? `+${weightDifference}kg` : `${weightDifference}kg`;


  weightDifferenceElement.textContent = `${weightDifferenceText}`;
  updateProgressBar(weightDifference);
}

function updateProgressBar(weightDifference) {
  
  const progressPercentage = Math.abs(weightDifference) * 10;


  const progressBar = document.querySelector('.progress-gains');
  progressBar.style.width = `${progressPercentage}%`;

  if (weightDifference < 0) {
    progressBar.classList.remove('progress-gains');
    progressBar.classList.add('progress-loss');
  } else {
    progressBar.classList.remove('progress-loss');
    progressBar.classList.add('progress-gains');
  }
}

async function fetchUserDetails() {
  try {
    const response = await fetch('/api/userinfo');
    if (response.ok) {
      const result = await response.json();

      document.querySelector(".profile-height").textContent = result.user.height ? result.user.height + "m" : '';
      document.querySelector(".profile-weight").textContent = result.user.weight ? result.user.weight + "kg" : '';
      document.querySelector(".profile-age").textContent = result.user.age ? result.user.age + "y" : '';
    } else {
      const error = await response.json();
      console.error('Error fetching user details:', error.message);
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
  }
}

async function getRecommendedProteinIntake() {
  try {
    const response = await fetch('/api/get-user-weight');
    const data = await response.json();
    const weight = data.weight;
    const proteinIntake = weight * 0.8 * 2.2;

    return proteinIntake;
  } catch (error) {
    console.error("Error fetching user's weight:", error);
  }
}
async function loadLatestGoal() {
  try {
    const response = await fetch('/api/get-latest-goal');
    if (response.ok) {
      const goal = await response.json();
      if (goal) {
        renderWeightDifference(goal.weightDifference);
      }
    } else {
      const error = await response.json();
      console.error('Error retrieving latest goal:', error.message);
    }
  } catch (error) {
    console.error('Error retrieving latest goal:', error);
  }
}

loadLatestGoal();


function showAlert(message) {
  const alert = document.getElementById('alert');
  const alertMessage = document.getElementById('alert-message');

  alertMessage.textContent = message;
  alert.classList.add('show');

  setTimeout(() => {
    alert.classList.remove('show');
  }, 3000);
}

async function updateProfileTitle() {
  const proteinIntake = await getRecommendedProteinIntake();
  const profileTitle = document.querySelector('.profile-title');
  profileTitle.textContent = `Daily protein intake: ${proteinIntake.toFixed(1)}g`;
}

updateProfileTitle();

document.addEventListener('DOMContentLoaded', () => {
  fetchUserDetails();
});

