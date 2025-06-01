const videoElement = document.getElementById("anime-video");
const submitButton = document.getElementById("submit-btn");
const nextButton = document.getElementById("next-btn");
const guessInput = document.getElementById("guess-input");
const popupMessage = document.getElementById("popup-message");
const suggestionsList = document.getElementById("suggestions");

const result = document.getElementById("result");

let currentAnimeTitle = "";

// Video clips array
const videoClips = [
    "videos/anime1.mp4",
    "videos/anime2.mp4",
    //"videos/anime3.mp4",
    //"videos/anime4.mp4",
    //"videos/anime5.mp4",
    //"videos/anime6.mp4",
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
];

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
    const randomIndex = Math.floor(Math.random() * videoClips.length);
    const selectedClip = videoClips[randomIndex];
    videoElement.src = selectedClip;;
}

// Event listener for the next button to load a new video
nextButton.addEventListener("click", () => {
    loadRandomClip();
    nextButton.classList.add("hidden"); // Hide the next button again
});

submitButton.addEventListener("click", () => {
    const guess = guessInput.value.trim().toLowerCase();
    if (!guess) {
        return; // Do nothing if input is empty
    }
    if (guess.includes(currentAnimeTitle) || currentAnimeTitle.includes(guess)) {
        resultText.textContent = "Correct! 🎉";
        resultText.style.color = "lightgreen";
    }
    else {
        resultText.textContent = `Incorrect! The correct answer was: ${currentAnimeTitle}`;
        resultText.style.color = "tomato";
    }

    setTimeout(() => {
        guessInput.value = ""; // Clear input
        resultText.textContent = ""; // Clear result text
        loadRandomClip(); // Load a new anime intro
    }, 3000); // Wait 3 seconds before loading a new intro)
});

// Load first intro
loadRandomClip();