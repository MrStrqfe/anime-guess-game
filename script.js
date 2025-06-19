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
const volumeSlider = document.getElementById("volume-slider");
const muteButton = document.getElementById("mute-btn");
const restartVideoButton = document.getElementById("reset-video-btn");
const introPopup = document.getElementById("intro-popup");
const startGameBtn = document.getElementById("start-game-btn");
const clipSourceButton = document.getElementById("clip-source-btn");
const incorrectGuessPopup = document.getElementById("incorrect-guess-popup");
const remainingGuessesCount = document.getElementById("remaining-guesses-count");

//let currentAnimeTitle = ""; // Variable to store the current anime title
let currentAccepedAnswers = []; // Variable to store accepted answers for the current video
let score = 0;
let usedClips = []; // Array to keep track of used video clips
let isMuted = false;
let lastVolume = 1;
let usingOnlineClips = false;
let remainingGuesses = 3;
let maxGuesses = 3;
let currentClipUrl = "";
let questionsAnswered = 0;
let totalQuestions = 10;

// Set initial volume
videoElement.volume = 1;


// Video clips array
let videoClips = {};
const fallbackClips = {
    "videos/anime1.mp4": {
        answers: ["Attack on Titan", "Shingeki no Kyojin"],
        quality: "720p"
    },
    "videos/anime2.mp4": {
        answers: ["Blue Box", "Ao no Hako"],
        quality: "720p",
    },
    "videos/anime3.mp4": {
        answers: ["Haikyuu", "Haikyuu!!", "Haikyuu!! To the Top"],
        quality: "480p",    
    },
    "videos/anime4.mp4": {
        answers: ["Blue Lock"],
        quality: "480p",
    },
    "videos/anime5.mp4": {
        answers: ["Hell's Paradise", "Hell Paradise","Jigokuraku"],
        quality: "480p", 
    },
    "videos/anime6.mp4": {
        answers: ["Your Lie in April", "Shigatsu wa Kimi no Uso"],
        quality: "480p"
    },
    "videos/anime7.mp4": {
        answers: ["Kowloon Generic Romance"],
        quality: "480p"
    },
    "videos/anime8.mp4": {
        answers:["Demon Slayer", "Demon Slayer: Kimetsu no Yaiba", "Demon Slayer: Entertainment district arc", "Kimetsu no Yaiba"],
        quality: "480p"
    },
    "videos/anime9.mp4": {
        answers: ["Hunter x Hunter", "Hunter Hunter"],
        quality: "480p"
    },
    "videos/anime10.mp4": {
        answers: ["Sword Art Online", "Sword Art Online: Alicization","Sword Art Online Alicization", "SAO"],
        quality: "480p"
    },
    "videos/anime11.mp4": {
        answers: ["The Beginning After the End", "Saikyou no Ousama, Nidome no Jinsei wa Nani wo Suru?", 
            "Saikyou no Ousama, Nidome no Jinsei wa Nani wo Suru"],
        quality: "480p",
    },
    "videos/anime12.mp4": {
        answers: ["Kaiju No. 8", "Kaiju No 8", "Kaiju", "Kaijuu 8-gou"],
        quality: "480p",
    },
    //"videos/anime13.mp4",
    //"videos/anime14.mp4",
    //"videos/anime15.mp4",
    //"videos/anime16.mp4",
    //"videos/anime17.mp4",
    //"videos/anime18.mp4",
    //"videos/anime19.mp4",
    //"videos/anime20.mp4",
};

async function fetchPopularAnimeOpenings() {
    const query = `
    query {
        Page(perPage: 100) {
            media(type: ANIME, sort: POPULARITY_DESC, status:FINISHED) {
                title {
                    romaji
                    english
                    native
                }
                id
                idMal
            }
        }
    }`;

    const response = await fetch(`https://graphql.anilist.co`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({ query })
    });

    const data = await response.json();
    const animeList = data.data.Page.media;

    for (const anime of animeList) {
        const titles = [
            anime.title.english,
            anime.title.romaji,
            anime.title.native
        ].filter(Boolean);
        
        // Use a placeholder or try to find videos
        videoClips[`aniList_${anime.id}`] = titles;
    }

    return animeList;
}

async function getYoutubeOpening(animeTitle) {
    const searchQuery = encodeURIComponent(`${animeTitle} opening`);
    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&key=YOUR_YOUTUBE_API_KEY`
    );
    const data = await response.json();
    return data.items[0]?.id.videoId;
}

// Using AnimeThemes.moe API
async function fetchAnimeThemes() {
    try {
        const response = await fetch('https://api.animethemes.moe/anime?include=animethemes.animethemeentries.videos&filter[has]=animethemes&filter[animetheme][type]=OP&page[size]=100');
        
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

        const { anime } = await response.json();
        
        anime.forEach(({ name, slug, animethemes }) => {
            // Get all OP videos with their qualities
            const opVideos = animethemes
                .filter(theme => theme.type === 'OP')
                .flatMap(theme => 
                    theme.animethemeentries.flatMap(entry => 
                        entry.videos
                            .filter(video => video.overlap === "None")
                            .map(video => ({
                                url: video.link,
                                quality: video.quality || '480p' // Default to 480p if no quality specified
                            }))
                    )
                );

            if (opVideos.length > 0) {
                // Select the highest quality available (order: 1080p > 720p > 480p)
                const bestVideo = selectBestQualityVideo(opVideos);
                const titles = getAllAnimeNames(name, slug);
                
                // Store with both URL and accepted answers
                videoClips[bestVideo.url] = {
                    answers: titles,
                    quality: bestVideo.quality
                };
            }
        });
        
        console.log(`Loaded ${Object.keys(videoClips).length} anime openings with quality preference`);
    } catch (error) {
        console.error('Failed to fetch anime themes:', error);
        throw error;
    }
}

function selectBestQualityVideo(videos) {
    // Quality priority order
    const qualityOrder = { '1080p': 3, '720p': 2, '480p': 1, '360p': 0 };
    
    return videos.reduce((best, current) => {
        const currentScore = qualityOrder[current.quality] || 0;
        const bestScore = qualityOrder[best.quality] || 0;
        return currentScore > bestScore ? current : best;
    }, videos[0]);
}

// Helper function to generate all acceptable names for an anime
function getAllAnimeNames(primaryName, slug) {
    const names = [primaryName];
    
    // Add slug as alternative name (e.g., "attack-on-titan" -> "attack on titan")
    names.push(slug.replace(/-/g, ' '));
    
    // Add common alternative formats
    if (primaryName.includes(':')) {
        names.push(primaryName.split(':')[0].trim());
    }
    if (primaryName.includes('!')) {
        names.push(primaryName.replace(/!/g, '').trim());
    }
    
    // Add common abbreviations (e.g., "Attack on Titan" -> "AoT")
    if (primaryName.split(' ').length >= 3) {
        const abbreviation = primaryName.split(' ')
            .map(word => word[0])
            .join('');
        names.push(abbreviation);
    }
    
    // Return unique names, lowercase for consistency
    return [...new Set(names)]
        .map(name => name.toLowerCase())
        .filter(name => name.length > 0);
}

async function initClips(useOnline = false) {
    try {
        if (useOnline) {
            await fetchAnimeThemes();
            console.log("Using online clips");
        } else {
            videoClips = {...fallbackClips};
            console.log("Using local clips");
        }
        return true;
    } catch (error) {
        console.error("Failed to load clips:", error);
        videoClips = {...fallbackClips};
        return false;
    }
}

// Clip source toggle handler
clipSourceButton.addEventListener("click", async () => {
    clipSourceButton.disabled = true;
    clipSourceButton.innerHTML = '<span class="icon">⏳</span> Loading...';
    
    usingOnlineClips = !usingOnlineClips;
    
    try {
        const success = await initClips(usingOnlineClips);
        if (success) {
            // Reset game state when switching sources
            usedClips = [];
            score = 0;
            scoreDisplay.textContent = `Score: ${score}`;
            
            // Update button text
            clipSourceButton.innerHTML = 
                usingOnlineClips ? 
                '<span class="icon">💾</span> Use Local Clips' : 
                '<span class="icon">🌐</span> Use Online Clips';
            
            // Load a new clip
            loadRandomClip();
        }
    } catch (error) {
        console.error("Failed to switch clip source:", error);
    }

    clipSourceButton.disabled = false;
});

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

// Volume slider event listener
volumeSlider.addEventListener("input", () => {
    videoElement.volume = volumeSlider.value;
    videoElement.muted = false;
    isMuted = false;
    updateVolumeIcon();
});

// Mute button event listener
muteButton.addEventListener("click", () => {
    isMuted = !isMuted;
    videoElement.muted = isMuted;

    if (isMuted) {
        lastVolume = videoElement.volume;
        volumeSlider.value = 0;
    }
    else {
        volumeSlider.value = lastVolume;
        videoElement.volume = lastVolume;
    }

    updateVolumeIcon();
});

// Update volume icon based on state
function updateVolumeIcon() {
    if (videoElement.muted || videoElement.volume === 0) {
        muteButton.querySelector(".volume-icon").textContent = "🔇";
    } else if (videoElement.volume < 0.5) {
        muteButton.querySelector(".volume-icon").textContent = "🔈";
    } else {
        muteButton.querySelector(".volume-icon").textContent = "🔊";
    }
}

// Update icon when video volume changes
videoElement.addEventListener("volumechange", updateVolumeIcon);

// Function to play the next video in the list
const loadRandomClip = () => {
    // Reset guesses for new clip
    remainingGuesses = maxGuesses;

    // Ensure videoClips is loaded
    if (Object.keys(videoClips).length === 0) {
        console.error("No video clips loaded");
        return;
    }

    const clipPaths = Object.keys(videoClips);
    const unusedClips = clipPaths.filter(path => !usedClips.includes(path));

    if (unusedClips.length === 0) {
        endGame();
        return;
    }

    const selectedClip = unusedClips[Math.floor(Math.random() * unusedClips.length)];
    currentClipUrl = selectedClip;
    videoElement.src = selectedClip;
    videoElement.style.filter = "blur(5px)";
    
    // Set the accepted answers for this clip
    currentAccepedAnswers = videoClips[selectedClip].answers;
    
    // Update UI to show remaining guesses
    updateGuessesDisplay();
    
    usedClips.push(selectedClip);
};

const updateGuessesDisplay = () => {
    const guessesElement = document.getElementById("guesses-display");
    if (guessesElement) {
        guessesElement.textContent = `Guesses remaining: ${remainingGuesses}`;

        // Visual feedback based on remaining guesses
        if (remainingGuesses === 2) {
            guessesElement.style.color = "#FFA500"; // Orange
        }
        else if (remainingGuesses === 1) {
            guessesElement.style.color = "#FF4500"; // Red-Orange
        }
        else {
            guessesElement.style.color = "#4CAF50"; // Green
        }
    }
}

function endGame() {
    // Calculate accuracy
    const accuracy = Math.round((score / totalQuestions) * 100);
    
    // Update the score popup content
    finalScoreDisplay.textContent = score;
    document.getElementById("total-questions").textContent = totalQuestions;
    document.getElementById("accuracy").textContent = `${accuracy}%`;
    
    // Show the score popup
    scorePopup.classList.remove("hidden");
    nextButton.classList.add("hidden");
    submitButton.classList.add("hidden");
    videoElement.pause();
}

// Event listener for the next button to load a new video
nextButton.addEventListener("click", () => {
    document.getElementById("answer-popup").classList.add("hidden");
    loadRandomClip();
    guessInput.value = ""; // Clear the input field
    nextButton.classList.add("hidden"); // Hide the next button again
    submitButton.classList.remove("hidden");
    result.textContent = "";
});

// submitGuess:
//  function to submit the answer when called
function submitGuess() {
    if (submitButton.classList.contains("hidden")) return;

    const userGuess = guessInput.value.trim().toLowerCase();
    
    if (userGuess === "") {
        showPopupMessage("Please enter your guess");
        return;
    }

    videoElement.pause();

    // Check if any of the accepted answers match
    const isCorrect = currentAccepedAnswers.some(answer => 
        answer.toLowerCase() === userGuess
    );

    if (isCorrect) {
        handleCorrectGuess();
    } else {
        remainingGuesses--;
        updateGuessesDisplay();

        if (remainingGuesses <= 0) {
            handleNoGuessesLeft();
        } else {
            showIncorrectGuessPopup();
        }
    }
}

function showIncorrectGuessPopup() {
  const popup = document.getElementById("incorrect-guess-popup");
  
  // Reset animation by cloning and replacing the element
  const newPopup = popup.cloneNode(true);
  popup.parentNode.replaceChild(newPopup, popup);
  
  // Show the popup
  newPopup.classList.remove("hidden");
  
  // Hide after 2 seconds (matches animation duration)
  setTimeout(() => {
    newPopup.classList.add("hidden");
  }, 2000);
  
  // Clear the input and focus it for the next guess
  guessInput.value = "";
  guessInput.focus();
}

// Add this function to handle when guesses run out
function handleNoGuessesLeft() {
    // Reveal the video
    videoElement.style.filter = "none";
    questionsAnswered++;
    
    // Show the correct answer in a styled popup
    const popup = document.getElementById("correct-guess-popup");
    const revealedTitle = document.getElementById("revealed-anime-title");
    const continueBtn = document.getElementById("continue-btn");
    const header = popup.querySelector(".popup-header h2");
    const scoreAdded = popup.querySelector(".score-added");
    const popupBody = popup.querySelector(".popup-body p");
    
    // Customize for wrong answer
    popup.classList.add("wrong-answer");
    header.innerHTML = 'Oops! <i class="fas fa-times-circle"></i>';
    header.style.color = "var(--danger)";
    scoreAdded.style.display = "none";
    popupBody.textContent = "The correct answer was:";
    revealedTitle.textContent = currentAccepedAnswers[0];
    
    // Show the popup
    popup.classList.remove("hidden");
    
    // Disable further guessing
    submitButton.classList.add("hidden");
    
    // Clear any previous event listeners to avoid duplicates
    continueBtn.replaceWith(continueBtn.cloneNode(true));
    const newContinueBtn = document.getElementById("continue-btn");
    
    // Continue button functionality
    newContinueBtn.addEventListener("click", () => {
        popup.classList.add("hidden");
        popup.classList.remove("wrong-answer");
        header.innerHTML = 'Correct! <i class="fas fa-check-circle"></i>';
        header.style.color = "var(--success)";
        popupBody.textContent = "You guessed it right!";
        scoreAdded.style.display = "block";
        
        if (questionsAnswered >= totalQuestions) {
            endGame();
        } else {
            loadRandomClip();
            guessInput.value = "";
            result.textContent = "";
            submitButton.classList.remove("hidden");
        }
    });
    
    // Also allow pressing Enter to continue
    const handleKeyPress = function(e) {
        if (e.code === "Enter" && !popup.classList.contains("hidden")) {
            document.removeEventListener("keydown", handleKeyPress);
            popup.classList.add("hidden");
            popup.classList.remove("wrong-answer");
            header.innerHTML = 'Correct! <i class="fas fa-check-circle"></i>';
            header.style.color = "var(--success)";
            popupBody.textContent = "You guessed it right!";
            scoreAdded.style.display = "block";
            
            if (questionsAnswered >= totalQuestions) {
                endGame();
            } else {
                loadRandomClip();
                guessInput.value = "";
                result.textContent = "";
                submitButton.classList.remove("hidden");
            }
        }
    };
    
    document.addEventListener("keydown", handleKeyPress, { once: true });
}

function handleCorrectGuess() {
    // Hide incorrect popup if it's showing
    incorrectGuessPopup.classList.add("hidden");

    // Show the correct guess popup
    const popup = document.getElementById("correct-guess-popup");
    const revealedTitle = document.getElementById("revealed-anime-title");
    const continueBtn = document.getElementById("continue-btn");
    const popupBody = popup.querySelector(".popup-body p");
    
    // Set the revealed anime title
    popupBody.textContent = "You guessed it right!";
    revealedTitle.textContent = currentAccepedAnswers[0];
    
    // Create confetti effect
    createConfetti();
    
    // Show the popup
    popup.classList.remove("hidden");
    
    // Update game state
    videoElement.style.filter = "none";
    score++;
    questionsAnswered++;
    scoreDisplay.textContent = score;
    submitButton.classList.add("hidden");
    
    // Clear any previous event listeners to avoid duplicates
    continueBtn.replaceWith(continueBtn.cloneNode(true));
    const newContinueBtn = document.getElementById("continue-btn");
    
    // Continue button functionality
    newContinueBtn.addEventListener("click", () => {
        popup.classList.add("hidden");
        if (questionsAnswered >= totalQuestions) {
            endGame();
        } else {
            loadRandomClip();
            guessInput.value = "";
            result.textContent = "";
            submitButton.classList.remove("hidden");
        }
    });
    
    // Also allow pressing Enter to continue
    const handleKeyPress = function(e) {
        if (e.code === "Enter" && !popup.classList.contains("hidden")) {
            document.removeEventListener("keydown", handleKeyPress);
            popup.classList.add("hidden");
            if (questionsAnswered >= totalQuestions) {
                endGame();
            } else {
                loadRandomClip();
                guessInput.value = "";
                result.textContent = "";
                submitButton.classList.remove("hidden");
            }
        }
    };
    
    document.addEventListener("keydown", handleKeyPress, { once: true });
}

function createConfetti() {
    const container = document.querySelector(".confetti-container");
    container.innerHTML = ""; // Clear previous confetti
    
    const colors = [
        "var(--primary)", 
        "var(--secondary)", 
        "var(--accent)", 
        "gold", 
        "var(--success)"
    ];
    
    // Create 50 pieces of confetti
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement("div");
        confetti.classList.add("confetti");
        
        // Random properties
        const size = Math.random() * 10 + 5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;
        
        // Apply styles
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        confetti.style.backgroundColor = color;
        confetti.style.left = `${left}%`;
        confetti.style.animationDuration = `${animationDuration}s`;
        confetti.style.animationDelay = `${delay}s`;
        
        // Random shape
        if (Math.random() > 0.5) {
            confetti.style.borderRadius = "50%";
        }
        
        container.appendChild(confetti);
    }
}

function showPopupMessage(message) {
    popupMessage.textContent = message;
    popupMessage.classList.remove("hidden");
    setTimeout(() => popupMessage.classList.add("hidden"), 2000);
} 

// submitButton event listener calls submitGuess
submitButton.addEventListener("click", submitGuess);

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
    questionsAnswered = 0;
    scoreDisplay.textContent = score;

    // Hide the popup
    scorePopup.classList.add("hidden");

    // Start a new game
    loadRandomClip();
    guessInput.value = "";
    result.textContent = "";
    submitButton.classList.remove("hidden");
});

function updateButtonIcon() {
    const icon = playPauseButton.querySelector("i"); // Changed to look for the <i> element
    if (icon) { // Add null check just in case
        icon.className = videoElement.paused ? 
            "fas fa-play icon" : 
            "fas fa-pause icon";
    }
}

// Initialize button state
updateButtonIcon();

// These two lines go here - right after the function they're using
videoElement.addEventListener("play", updateButtonIcon);
videoElement.addEventListener("pause", updateButtonIcon);

// Keyboard shortcut can go after all the video event listeners
document.addEventListener("keydown", (e) => {
    // Handle Enter key press differently when input is focused
    if (e.code === "Enter" && document.activeElement === guessInput) {
        e.preventDefault(); // Prevent form submission behaviour
        submitGuess(); // Call the submit function
        return;
    }

    // Ignore all shortcuts if focused on input or suggestions are available
    if (document.activeElement === guessInput || !suggestionsList.classList.contains("hidden")) {
        return;
    }

    if (e.code === "Space" && document.activeElement !== guessInput) {
        e.preventDefault();
        if (videoElement.paused) {
            videoElement.play();
        } else {
            videoElement.pause();
        }
        updateButtonIcon();
    }

    // Add Enter to submit guess
    if (e.code === "Enter") {
        // Only trigger if the submit button is visible (not after correct answer)
        if (!submitButton.classList.contains("hidden")) {
            submitGuess();
        }
    }

    // Add volume control with up/down arrows
    if (e.code === "ArrowRight") {
        e.preventDefault();
        videoElement.volume = Math.min(videoElement.volume + 0.1, 1);
        volumeSlider.value = videoElement.volume;
        updateVolumeIcon();
    } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        videoElement.volume = Math.max(videoElement.volume - 0.1, 0);
        volumeSlider.value = videoElement.volume;
        updateVolumeIcon();
    } else if (e.code === "KeyM") {
        e.preventDefault();
        muteButton.click(); // Trigger mute toggle
    }

    // Add R Key to restart video
    if (e.code === "KeyR") {
        e.preventDefault();
        restartVideo();
    }
});

// Function to restart video
function restartVideo() {
    // Reset video to beginning
    videoElement.currentTime = 0;

    // Reapply blur if they had guessed correctly
    if (!submitButton.classList.contains("hidden")) {
        videoElement.style.filter = "blur(5px)";
    }

    // If video was paused, play it after restart
    if (videoElement.paused) {
        videoElement.play().catch(e => console.log("Play failed:", e));
    }

    // Update the play/pause button icon if need
    updateButtonIcon();
}

restartVideoButton.addEventListener("click", restartVideo);

// function for starting the game
async function startGame() {
    introPopup.classList.add("hidden");

    // Initialize with local clips
    usingOnlineClips = false;
    await initClips(false);
    clipSourceButton.innerHTML = '<span class="icon">🌐</span> Use Online Database';

    // Reset Game state
    usedClips = []; // Reset used Clips
    score = 0;
    questionsAnswered = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    scorePopup.classList.add("hidden");

    loadRandomClip(); // Initialize game
}

startGameBtn.addEventListener("click", async () => {
    try {
        await initClips(); // Wait for clips to load
        startGame();
    } catch (error) {
        console.error("Failed to initialize: ", error);
        // Fallback to local clips
        videoClips = {...fallbackClips};
        startGame();
    }
});

// Initialize the game properly
async function initializeGame() {
    // Make sure the button exists
    const startGameBtn = document.getElementById("start-game-btn");
    if (!startGameBtn) {
        console.error("Start game button not found!");
        return;
    }

    // Create guesses display element if it doesn't exist
    if (!document.getElementById("guesses-display")) {
        const guessesDisplay = document.createElement("div");
        guessesDisplay.id = "guesses-display";
        guessesDisplay.style.margin = "10px 0";
        guessesDisplay.style.fontWeight = "bold";
        document.querySelector(".actions").prepend(guessesDisplay);
    }

    // Set up the click handler
    startGameBtn.addEventListener("click", async () => {
        console.log("Start button clicked"); // Debugging
        try {
            await initClips(false); // Use local clips by default
            startGame();
        } catch (error) {
            console.error("Failed to initialize:", error);
            // Fallback to local clips
            videoClips = {...fallbackClips};
            startGame();
        }
    });

    console.log("Game initialization complete");
}

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});

// Save preference
localStorage.setItem('preferredClipSource', usingOnlineClips ? 'online' : 'local');

// Load preference
const preferredSource = localStorage.getItem('preferredClipSource');
if (preferredSource === 'online') {
    // Initialize with online clips
}

function updateSourceIndicator() {
    const indicator = document.getElementById('source-indicator');
    indicator.textContent = usingOnlineClips ? 
        "Source: Online (AnimeThemes.moe)" : 
        "Source: Local Clips";
    indicator.style.color = usingOnlineClips ? "lightgreen" : "orange";
}