const videoElement = document.getElementById("anime-video");
const submitButton = document.getElementById("submit-btn");
const nextButton = document.getElementById("next-btn");
const guessInput = document.getElementById("guess-input");
const popupMessage = document.getElementById("popup-message");
const suggestionsList = document.getElementById("suggestions");
const scoreDisplay = document.getElementById("score");
const result = document.getElementById("result");
const scorePopup = document.getElementById("score-popup");
const finalScoreDisplay = document.getElementById("final-score");
const playAgainButton = document.getElementById("play-again-btn");
const playPauseButton = document.getElementById("play-pause-btn");
const playIcon = "▶";
const pauseIcon = "⏸";


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
    "videos/anime5.mp4": ["Hell's Paradise", "Hell Paradise","Jigokuraku"],
    "videos/anime6.mp4": ["Your Lie in April", "Shigatsu wa Kimi no Uso"],
    "videos/anime7.mp4": ["Kowloon Generic Romance"],
    "videos/anime8.mp4": ["Demon Slayer", "Demon Slayer: Kimetsu no Yaiba", "Demon Slayer: Entertainment district arc"],
    "videos/anime9.mp4": ["Hunter x Hunter", "Hunter Hunter"],
    "videos/anime10.mp4": ["Sword Art Online", "Sword Art Online Alicization", "SAO"],
    "videos/anime11.mp4": ["The Beginning After the End"],
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
        // Show the score popup instead of just a message
        finalScoreDisplay.textContent = score;
        scorePopup.classList.remove("hidden");
        nextButton.classList.add("hidden"); // Hide the next button
        submitButton.classList.add("hidden");
        videoElement.pause();
        return;
    }

    // Select a random clip from only the unused ones
    const randomIndex = Math.floor(Math.random() * unusedClips.length);
    const selectedClip = unusedClips[randomIndex];

    videoElement.src = selectedClip;
    videoElement.style.filter = "blur(5px)"; // Reapply blue for the next clip

    // Play the new video when it's ready
    videoElement.onloadeddata = function() {
        videoElement.play().catch(e => console.log("Autoplay prevented:", e));
    }

    currentAccepedAnswers = videoClips[selectedClip].map(ans => ans.toLowerCase()); // Update accepted answers for the current video

    // Add to used list
    usedClips.push(selectedClip);
};

// Event listener for the next button to load a new video
nextButton.addEventListener("click", () => {
    loadRandomClip();
    guessInput.value = ""; // Clear the input field
    nextButton.classList.add("hidden"); // Hide the next button again
    submitButton.classList.remove("hidden");
    result.textContent = "";
});

submitButton.addEventListener("click", () => {
    // Pause the video when submitting a guess
    videoElement.pause();

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
        videoElement.style.filter = "none"; // Remove blur on correct answer
        score++; // Increment score
        scoreDisplay.textContent = `Score: ${score}`; // Update score display
        submitButton.classList.add("hidden"); // Hide the hidden button
        nextButton.classList.remove("hidden"); // Show the next button
    }
    else {
        result.textContent = "Incorrect! Try again.";
        result.style.color = "red";
    }
});

playPauseButton.addEventListener("click", () => {
    if (videoElement.paused) {
        videoElement.play();
    } else {
        videoElement.pause();
    }
    updateButtonIcon();
});

// Play Again Button Functionality
playAgainButton.addEventListener("click", () => {
    // Reset game state
    usedClips = [];
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;

    // Hide the popup
    scorePopup.classList.add("hidden");

    // Start a new game
    loadRandomClip();
    guessInput.value = "";
    result.textContent = "";
    submitButton.classList.remove("hidden");
});

function updateButtonIcon() {
    playPauseButton.querySelector(".icon").textContent =
        videoElement.paused ? playIcon : pauseIcon;
}

// Load first intro
loadRandomClip();

// Initialize button state
updateButtonIcon();

// These two lines go here - right after the function they're using
videoElement.addEventListener("play", updateButtonIcon);
videoElement.addEventListener("pause", updateButtonIcon);

// (Optional) Keyboard shortcut can go after all the video event listeners
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && document.activeElement !== guessInput) {
        e.preventDefault();
        if (videoElement.paused) {
            videoElement.play();
        } else {
            videoElement.pause();
        }
        updateButtonIcon();
    }
});