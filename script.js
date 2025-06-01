const videoElement = document.getElementById("anime-video");
const submitButton = document.getElementById("submit-btn");
const nextButton = document.getElementById("next-btn");
const guessInput = document.getElementById("guess-input");
const popupMessage = document.getElementById("popup-message");
const suggestionsList = document.getElementById("suggestions");
const scoreDisplay = document.getElementById("score");
const result = document.getElementById("result");

//let currentAnimeTitle = ""; // Variable to store the current anime title
let currentAccepedAnswers = []; // Variable to store accepted answers for the current video
let score = 0;
let usedClips = []; // Array to keep track of used video clips

// Video clips array
const videoClips = {
    "videos/anime1.mp4": ["Attack on Titan", "Shingeki no Kyojin"],
    "videos/anime2.mp4": ["Blue Box", "Ao no Hako"],
    "videos/anime3.mp4": ["Haikyuu", "Haikyuu!!", "Haikyuu!! To the Top"],
    "videos/anime4.mp4": ["Blue Lock"],
    "videos/anime5.mp4": ["Hell's Paradise", "Hell Paradise","Jigokuroku"],
    "videos/anime6.mp4": ["Your Lie in April", "Shigatsu wa Kimi no Uso"],
    //"videos/anime7.mp4",
    //"videos/anime8.mp4",
    //"videos/anime9.mp4",
    //"videos/anime10.mp4",
    //"videos/anime11.mp4",
    //"videos/anime12.mp4",
    //"videos/anime13.mp4",
    //"videos/anime14.mp4",
    //"videos/anime15.mp4",
    //"videos/anime16.mp4",
    //"videos/anime17.mp4",
    //"videos/anime18.mp4",
    //"videos/anime19.mp4",
    //"videos/anime20.mp4",
};

// Debounce function to limit API calls
let debounceTimeout;
const debounce = (func, delay) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(func, delay);
};

guessInput.addEventListener("input", () => {
    const query = guessInput.value.trim();
    if (query.length < 2) {
        suggestionsList.classList.add("hidden");
        suggestionsList.innerHTML = "";
        return;
    }

    debounce(() => fetchSuggestions(query), 300);
});

async function fetchSuggestions(query) {
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`);
    const data = await response.json();
    const results = data.data;

    suggestionsList.innerHTML = ""; // Clear previous suggestions
    if (results.length === 0) {
        suggestionsList.classList.add("hidden");
        return;
    }

    results.forEach(anime => {
        const li = document.createElement("li");
        li.textContent = anime.title;
        li.addEventListener("click", () => {
            guessInput.value = anime.title; // Set the input to the clicked suggestion
            suggestionsList.classList.add("hidden"); // Hide suggestions after selection
        });
        suggestionsList.appendChild(li);
    });

    suggestionsList.classList.remove("hidden"); // Show suggestions
}

// Hide suggestions if you click outside the input
document.addEventListener("click", (e) => {
    if (!guessInput.contains(e.target) && !suggestionsList.contains(e.target)) {
        suggestionsList.classList.add("hidden");
    }
});


// Function to play the next video in the list
const loadRandomClip = () => {
    const clipPaths = Object.keys(videoClips); // Get array of video paths

    // Filter out used clips
    const unusedClips = clipPaths.filter(path => !usedClips.includes(path));

    if (unusedClips.length === 0) {
        result.textContent = "All clips have been used! Resetting...";
        result.style.color = "orange";
        nextButton.classList.add("hidden"); // Hide the next button
        return;
    }

    const randomIndex = Math.floor(Math.random() * clipPaths.length);
    const selectedClip = clipPaths[randomIndex];

    videoElement.src = selectedClip;

    currentAccepedAnswers = videoClips[selectedClip].map(ans => ans.toLowerCase()); // Update accepted answers for the current video

    // Add to used list
    usedClips.push(selectedClip);
};

// Event listener for the next button to load a new video
nextButton.addEventListener("click", () => {
    loadRandomClip();
    guessInput.value = ""; // Clear the input field
    nextButton.classList.add("hidden"); // Hide the next button again
});

submitButton.addEventListener("click", () => {
    const userGuess = guessInput.value.trim().toLowerCase(); // Get the user's guess and convert to lowercase

    if (userGuess === "") {
        // Show popup message
        popupMessage.classList.remove("hidden");

        // Hide it after 2 seconds
        setTimeout(() => {
            popupMessage.classList.add("hidden");
        }, 2000);
        return;
    }

    if (currentAccepedAnswers.includes(userGuess)) {
        result.textContent = "Correct! 🎉";
        result.style.color = "lightgreen";

        score++; // Increment score
        scoreDisplay.textContent = `Score: ${score}`; // Update score display

        nextButton.classList.remove("hidden"); // Show the next button
    }
    else {
        result.textContent = "Incorrect! Try again.";
        result.style.color = "red";
    }
});

// Load first intro
loadRandomClip();