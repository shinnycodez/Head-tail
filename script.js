let rotationCount = 0;
let userTeam = "";
let botTeam = "";
let userPlayers = [];
let botPlayers = [];
let userScore = 0;
let botScore = 0;
let userWickets = 0;
let botWickets = 0;
let currentBatsmanIndex = 0;
let isUserBatting = false;
let target = 0;
let isInningsOver = false;
let isFirstInnings = true;

// Over tracking - now tracking total balls instead of overs
let userBallsBowled = 0;
let botBallsBowled = 0;
let ballsInCurrentOver = 0;

// Anti-spam variables
let lastUserChoices = [];
const MAX_CHOICE_HISTORY = 3; // Track 3 choices for spam detection

// Track individual player stats
let userBatsmenStats = [];
let botBatsmenStats = [];

// Ball timer variables
let isBallInProgress = false;
let ballTimer = null;

// Gemini API variables
const geminiApiKey = "AIzaSyCScHjfpzU-tMyCj64aK26pg6UT1LN8mh8";
let geminiModel;
let commentaryHistory = [];

// Initialize Gemini model
async function initGemini() {
    try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        console.log("Gemini model initialized");
    } catch (error) {
        console.error("Error initializing Gemini:", error);
        // Fallback to simple commentary if Gemini fails
        geminiModel = null;
    }
}

// Call initialization when script loads
initGemini();

        // Show rules modal when page loads
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('rules-modal').classList.remove('hidden');
        });

        // Close rules and show team entry
        function closeRules() {
            document.getElementById('rules-modal').classList.add('hidden');
            document.getElementById('team-entry').classList.remove('hidden');
        }
// Convert balls to overs format (e.g. 38 balls = 6.2 overs)
function formatOvers(balls) {
    const overs = Math.floor(balls / 6);
    const ballsRemaining = balls % 6;
    return `${overs}.${ballsRemaining}`;
}

// Start the game by entering team names
function startGame() {
    userTeam = document.getElementById("user-team").value.trim();
    botTeam = document.getElementById("bot-team").value.trim();
    
    if (!userTeam || !botTeam) {
        alert("Please enter both team names.");
        return;
    }
    
    document.getElementById("team-entry").classList.add("hidden");
    document.getElementById("squad-selection").classList.remove("hidden");
    document.getElementById("user-squad-title").textContent = `${userTeam} Playing XI`;
    document.getElementById("bot-squad-title").textContent = `${botTeam} Playing XI`;
}

// Proceed to toss after squad selection
function proceedToToss() {
    // Clear previous player data
    userPlayers = [];
    botPlayers = [];
    lastUserChoices = [];
    commentaryHistory = [];
    
    // Get player inputs
    const userInputs = document.querySelectorAll("#squad-selection .w-full.md\\:w-1\\/2:first-child .squad-input");
    const botInputs = document.querySelectorAll("#squad-selection .w-full.md\\:w-1\\/2:last-child .squad-input");
    
    // Process user team players
    userInputs.forEach((input, index) => {
        const playerName = input.value.trim();
        userPlayers.push(playerName || `${userTeam} Player ${index + 1}`);
    });
    
    // Process bot team players
    botInputs.forEach((input, index) => {
        const playerName = input.value.trim();
        botPlayers.push(playerName || `${botTeam} Player ${index + 1}`);
    });
    
    // Validate at least some players are named
    if (userPlayers.every(name => !name.trim())) {
        alert(`Please name at least some players for ${userTeam}`);
        return;
    }
    if (botPlayers.every(name => !name.trim())) {
        alert(`Please name at least some players for ${botTeam}`);
        return;
    }
    
    // Initialize player stats
    userBatsmenStats = userPlayers.map(() => ({ runs: 0, balls: 0, isOut: false }));
    botBatsmenStats = botPlayers.map(() => ({ runs: 0, balls: 0, isOut: false }));
    
    // Proceed to next screen
    document.getElementById("squad-selection").classList.add("hidden");
    document.getElementById("game-section").classList.remove("hidden");
}

// Toss the coin and determine the winner
function tossCoin(userChoice) {
    const coin = document.getElementById("coin");
    const result = document.getElementById("result");
    const choiceButtons = document.getElementById("choice-buttons");
    const batBallButtons = document.getElementById("bat-ball-buttons");
    const finalResult = document.getElementById("final-result");

    const isHeads = Math.random() < 0.5;
    rotationCount += 720;
    const finalRotation = isHeads ? 0 : 180;

    coin.style.transform = `rotateY(${rotationCount + finalRotation}deg)`; 

    setTimeout(() => {
        const tossResult = isHeads ? "heads" : "tails";
        if (userChoice === tossResult) {
            result.innerText = `${userTeam} won the toss! Choose to bat or ball.`;
            result.style.color = "lightgreen";
            batBallButtons.classList.remove("hidden");
        } else {
            const botChoice = Math.random() < 0.5 ? "bat" : "ball";
            result.innerText = `${botTeam} won the toss and chooses to ${botChoice}.`;
            result.style.color = "red";
            finalResult.innerText = `${userTeam} will ${botChoice === "bat" ? "bowl" : "bat"}.`;
            isUserBatting = botChoice === "ball";
        }
        choiceButtons.classList.add("hidden");
        document.getElementById("start-innings-button").classList.remove("hidden");
    }, 1500);
}

// Choose to bat or ball
function chooseBatBall(choice) {
    isUserBatting = choice === "bat";
    document.getElementById("final-result").innerText = `You chose to ${choice}.`;
    document.getElementById("bat-ball-buttons").classList.add("hidden");
    document.getElementById("start-innings-button").classList.remove("hidden");
}

// Start the innings
function startInnings() {
    document.getElementById("game-section").classList.add("hidden");
    document.getElementById("gameplay-section").classList.remove("hidden");

    // Reset scores if first innings
    if (isFirstInnings) {
        userScore = 0;
        botScore = 0;
        userWickets = 0;
        botWickets = 0;
        currentBatsmanIndex = 0;
        userBallsBowled = 0;
        botBallsBowled = 0;
        ballsInCurrentOver = 0;
        lastUserChoices = [];
        commentaryHistory = [];
    } else {
        // For second innings, just reset the balls counter
        ballsInCurrentOver = 0;
        lastUserChoices = [];
    }

    // Reset player stats for new innings
    if (isUserBatting) {
        userBatsmenStats = userPlayers.map(() => ({ runs: 0, balls: 0, isOut: false }));
    } else {
        botBatsmenStats = botPlayers.map(() => ({ runs: 0, balls: 0, isOut: false }));
    }

    // Update display
    document.getElementById("user-team-name").innerText = userTeam;
    document.getElementById("bot-team-name").innerText = botTeam;

    if (isUserBatting) {
        document.getElementById("user-team-scorecard-title").innerText = `${userTeam} Batting`;
        document.getElementById("bot-team-scorecard-title").innerText = `${botTeam} Bowling`;
        if (isFirstInnings) {
            document.getElementById("result-text").innerText = `${userTeam} is batting first`;
            addCommentary(`${userTeam} are coming out to bat first. Let's play!`);
        } else {
            document.getElementById("result-text").innerText = `${userTeam} needs ${target} to win`;
            addCommentary(`${userTeam} needs ${target} runs to win. Exciting chase coming up!`);
        }
    } else {
        document.getElementById("user-team-scorecard-title").innerText = `${userTeam} Bowling`;
        document.getElementById("bot-team-scorecard-title").innerText = `${botTeam} Batting`;
        if (isFirstInnings) {
            document.getElementById("result-text").innerText = `${botTeam} is batting first`;
            addCommentary(`${botTeam} will bat first. The bowlers need to step up!`);
        } else {
            document.getElementById("result-text").innerText = `${botTeam} needs ${target} to win`;
            addCommentary(`${botTeam} needs ${target} runs to win. Can they do it?`);
        }
    }
    document.getElementById("result-text").classList.remove("hidden");

    isInningsOver = false;
    updateScorecard();
}

// Generate commentary for game events
async function generateCommentary(event, runs, isWicket = false) {
    if (!geminiModel) {
        // Simple fallback commentary if Gemini isn't available
        const simpleCommentary = isWicket 
            ? `OUT! ${getCurrentBatsman()} is dismissed!`
            : runs === 0 
                ? `Dot ball. Good delivery.`
                : runs === 4 
                    ? `FOUR! ${getCurrentBatsman()} finds the boundary.`
                    : runs === 6 
                        ? `SIX! ${getCurrentBatsman()} with a massive hit!`
                        : `${runs} run${runs > 1 ? 's' : ''} taken.`;
        
        addCommentary(simpleCommentary);
        return;
    }

    try {
        // Build the prompt
        const battingTeam = isUserBatting ? userTeam : botTeam;
        const bowlingTeam = isUserBatting ? botTeam : userTeam;
        const batsman = getCurrentBatsman();
        const score = isUserBatting ? userScore : botScore;
        const wickets = isUserBatting ? userWickets : botWickets;
        const overs = formatOvers(isUserBatting ? userBallsBowled : botBallsBowled);
        
        let prompt = `Generate a single, concise cricket commentary line (max 15 words) for this event:\n`;
        prompt += `Match: ${battingTeam} vs ${bowlingTeam}\n`;
        prompt += `Current batsman: ${batsman}\n`;
        prompt += `Score: ${score}/${wickets} in ${overs} overs\n`;
        
        if (isWicket) {
            prompt += `Event: Wicket falls!\n`;
            prompt += `Commentary should express the dismissal with appropriate emotion.`;
        } else {
            prompt += `Event: ${runs} run${runs > 1 ? 's' : ''} scored\n`;
            if (runs === 4) {
                prompt += `Commentary should describe a boundary with excitement.`;
            } else if (runs === 6) {
                prompt += `Commentary should describe a six with great enthusiasm.`;
            } else if (runs === 0) {
                prompt += `Commentary should describe a dot ball, possibly praising the bowler.`;
            } else {
                prompt += `Commentary should describe the runs taken.`;
            }
        }
        
        prompt += `\nKeep it short (1 sentence max), colorful, and cricket-appropriate.`;
        prompt += `\nExample for a six: "What a shot! ${batsman} launches it into the stands for a maximum!"`;
        prompt += `\nExample for a wicket: "Gone! ${batsman} edges it to the keeper, that's a big wicket!"`;
        
        // Add context from previous commentary
        if (commentaryHistory.length > 0) {
            prompt += `\n\nPrevious commentary context:\n${commentaryHistory.slice(-3).join('\n')}`;
        }

        // Generate the commentary
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        // Add to commentary history
        addCommentary(text);
        commentaryHistory.push(text);
        
        // Keep history manageable
        if (commentaryHistory.length > 10) {
            commentaryHistory.shift();
        }
    } catch (error) {
        console.error("Error generating commentary:", error);
        // Fallback to simple commentary
        generateCommentary(event, runs, isWicket); // This will use the fallback
    }
}

function getCurrentBatsman() {
    return isUserBatting 
        ? userPlayers[currentBatsmanIndex] 
        : botPlayers[currentBatsmanIndex];
}

function addCommentary(text) {
    const commentaryElement = document.getElementById("commentary-text");
    const entry = document.createElement("div");
    entry.className = "mb-1 border-b border-gray-700 pb-1";
    entry.textContent = `• ${text}`;
    commentaryElement.prepend(entry);
    
    // Limit to last 10 commentary entries
    if (commentaryElement.children.length > 10) {
        commentaryElement.removeChild(commentaryElement.lastChild);
    }
}

// Update the scorecard with detailed stats
function updateScorecard() {
    const userScorecard = document.getElementById("user-scorecard");
    const botScorecard = document.getElementById("bot-scorecard");

    userScorecard.innerHTML = "";
    botScorecard.innerHTML = "";

    // Update user team scorecard
    userPlayers.forEach((player, index) => {
        const stats = userBatsmenStats[index];
        const playerDiv = document.createElement("div");
        playerDiv.className = "grid grid-cols-12 gap-1 py-1 px-2";
        
        if (index === currentBatsmanIndex && isUserBatting && !stats.isOut) {
            playerDiv.classList.add("bg-yellow-100", "bg-opacity-10");
        }
        
        // Player name
        const nameSpan = document.createElement("div");
        nameSpan.className = "col-span-6 truncate";
        nameSpan.textContent = player;
        
        // Runs
        const runsSpan = document.createElement("div");
        runsSpan.className = "col-span-2 text-center";
        runsSpan.textContent = stats.runs;
        
        // Balls
        const ballsSpan = document.createElement("div");
        ballsSpan.className = "col-span-2 text-center";
        ballsSpan.textContent = stats.balls;
        
        // Strike Rate
        const srSpan = document.createElement("div");
        srSpan.className = "col-span-2 text-center";
        const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0";
        srSpan.textContent = sr;
        
        // Status indicator
        if (stats.isOut) {
            nameSpan.innerHTML += " <span class='text-red-500'>(out)</span>";
        } else if (index === currentBatsmanIndex && isUserBatting) {
            nameSpan.innerHTML += " <span class='text-green-500'>*</span>";
        }
        
        playerDiv.appendChild(nameSpan);
        playerDiv.appendChild(runsSpan);
        playerDiv.appendChild(ballsSpan);
        playerDiv.appendChild(srSpan);
        userScorecard.appendChild(playerDiv);
    });

    // Update bot team scorecard
    botPlayers.forEach((player, index) => {
        const stats = botBatsmenStats[index];
        const playerDiv = document.createElement("div");
        playerDiv.className = "grid grid-cols-12 gap-1 py-1 px-2";
        
        if (index === currentBatsmanIndex && !isUserBatting && !stats.isOut) {
            playerDiv.classList.add("bg-yellow-100", "bg-opacity-10");
        }
        
        // Player name
        const nameSpan = document.createElement("div");
        nameSpan.className = "col-span-6 truncate";
        nameSpan.textContent = player;
        
        // Runs
        const runsSpan = document.createElement("div");
        runsSpan.className = "col-span-2 text-center";
        runsSpan.textContent = stats.runs;
        
        // Balls
        const ballsSpan = document.createElement("div");
        ballsSpan.className = "col-span-2 text-center";
        ballsSpan.textContent = stats.balls;
        
        // Strike Rate
        const srSpan = document.createElement("div");
        srSpan.className = "col-span-2 text-center";
        const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0";
        srSpan.textContent = sr;
        
        // Status indicator
        if (stats.isOut) {
            nameSpan.innerHTML += " <span class='text-red-500'>(out)</span>";
        } else if (index === currentBatsmanIndex && !isUserBatting) {
            nameSpan.innerHTML += " <span class='text-green-500'>*</span>";
        }
        
        playerDiv.appendChild(nameSpan);
        playerDiv.appendChild(runsSpan);
        playerDiv.appendChild(ballsSpan);
        playerDiv.appendChild(srSpan);
        botScorecard.appendChild(playerDiv);
    });

    // Update total scores
    document.getElementById("user-score").textContent = userScore;
    document.getElementById("bot-score").textContent = botScore;
    document.getElementById("user-wickets").textContent = userWickets;
    document.getElementById("bot-wickets").textContent = botWickets;
    document.getElementById("user-total-score").textContent = userScore;
    document.getElementById("bot-total-score").textContent = botScore;
    
    // Update overs - now using accurate ball count
    if (isUserBatting) {
        document.getElementById("user-overs").textContent = formatOvers(userBallsBowled);
        document.getElementById("bot-overs").textContent = formatOvers(botBallsBowled);
    } else {
        document.getElementById("bot-overs").textContent = formatOvers(botBallsBowled);
        document.getElementById("user-overs").textContent = formatOvers(userBallsBowled);
    }
}

// Handle run selection with timer
function chooseRun(userRunChoice) {
    // Prevent multiple clicks while ball is in progress
    if (isInningsOver || isBallInProgress) return;
    
    // Set ball in progress and disable buttons
    isBallInProgress = true;
    const runButtons = document.querySelectorAll('.run-button');
    
    // Apply disabled styling to all buttons
    runButtons.forEach(btn => {
        btn.disabled = true;
        btn.classList.add(
            'opacity-60',          // Reduce opacity
            'cursor-not-allowed',  // Change cursor
            'grayscale-30',        // Partial grayscale
            'brightness-90',       // Slightly reduce brightness
            'transform',           // Prepare for scale transform
            'scale-95'             // Slightly shrink buttons
        );
        // Remove hover effects
        btn.classList.remove(
            'hover:brightness-110',
            'hover:scale-105',
            'active:scale-100'
        );
    });
    
    // Show countdown timer
    const timerDisplay = document.createElement('div');
    timerDisplay.id = 'ball-timer';
    timerDisplay.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white text-6xl font-bold rounded-full w-20 h-20 flex items-center justify-center z-50 animate-pulse';
    timerDisplay.textContent = '3';
    document.body.appendChild(timerDisplay);
    
    let countdown = 3;
    const timerInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            timerDisplay.textContent = countdown;
        } else {
            clearInterval(timerInterval);
            document.body.removeChild(timerDisplay);
            
            // Process the ball after timer completes
            processBall(userRunChoice);
            
            // Re-enable buttons after a short delay (with animation)
            setTimeout(() => {
                runButtons.forEach(btn => {
                    btn.disabled = false;
                    btn.classList.remove(
                        'opacity-60',
                        'cursor-not-allowed',
                        'grayscale-30',
                        'brightness-90',
                        'scale-95'
                    );
                    // Restore hover effects
                    btn.classList.add(
                        'hover:brightness-110',
                        'hover:scale-105',
                        'active:scale-100'
                    );
                    
                    // Add a quick "pop" animation when re-enabling
                    btn.classList.add('transform', 'scale-105');
                    setTimeout(() => {
                        btn.classList.remove('scale-105');
                    }, 150);
                });
                
                isBallInProgress = false;
            }, 300); // Slight delay before re-enabling
        }
    }, 500); // Countdown interval (1 second)
}

// Process the ball after timer completes
function processBall(userRunChoice) {
    // Track last user choices
    lastUserChoices.push(userRunChoice);
    if (lastUserChoices.length > MAX_CHOICE_HISTORY) {
        lastUserChoices.shift();
    }

    // Determine bot choice based on spam detection
    let botRunChoice;
    const isSpamming = lastUserChoices.length === MAX_CHOICE_HISTORY && 
                      lastUserChoices[0] === lastUserChoices[1] && 
                      lastUserChoices[1] === lastUserChoices[2];
    
    if (isSpamming) {
        if (isUserBatting) {
            // When user is batting, match their choice to get them out (on third repeat)
            botRunChoice = userRunChoice;
        } else {
            // When bot is batting, ensure we don't match their spammed choice
            do {
                botRunChoice = Math.floor(Math.random() * 7);
            } while (botRunChoice === userRunChoice);
        }
    } else {
        // Normal random choice (allow two repeats without punishment)
        botRunChoice = Math.floor(Math.random() * 7);
    }

    // Update game state
    if (isUserBatting) {
        userBallsBowled++;
    } else {
        botBallsBowled++;
    }
    
    // Handle batting logic
    if (isUserBatting) {
        if (userRunChoice === botRunChoice) {
            // Wicket falls when choices match
            generateCommentary("wicket", 0, true);
            userWickets++;
            userBatsmenStats[currentBatsmanIndex].isOut = true;
            userBatsmenStats[currentBatsmanIndex].balls++;
            currentBatsmanIndex++;
            document.getElementById("user-wickets").innerText = userWickets;
            
            lastUserChoices = [];
            
            if (userWickets === 10 || currentBatsmanIndex >= userPlayers.length) {
                endInnings();
                return;
            }
        } else {
            // No wicket, add runs
            generateCommentary("run", userRunChoice);
            userScore += userRunChoice;
            userBatsmenStats[currentBatsmanIndex].runs += userRunChoice;
            userBatsmenStats[currentBatsmanIndex].balls++;
            document.getElementById("user-score").innerText = userScore;
            
            if (!isFirstInnings && userScore >= target) {
                endInnings();
                return;
            }
        }
    } 
    // Handle bowling logic
    else {
        if (userRunChoice === botRunChoice) {
            // Wicket falls when choices match
            generateCommentary("wicket", 0, true);
            botWickets++;
            botBatsmenStats[currentBatsmanIndex].isOut = true;
            botBatsmenStats[currentBatsmanIndex].balls++;
            currentBatsmanIndex++;
            document.getElementById("bot-wickets").innerText = botWickets;
            
            lastUserChoices = [];
            
            if (botWickets === 10 || currentBatsmanIndex >= botPlayers.length) {
                endInnings();
                return;
            }
        } else {
            // No wicket, add runs
            generateCommentary("run", botRunChoice);
            botScore += botRunChoice;
            botBatsmenStats[currentBatsmanIndex].runs += botRunChoice;
            botBatsmenStats[currentBatsmanIndex].balls++;
            document.getElementById("bot-score").innerText = botScore;
            
            if (!isFirstInnings && botScore >= target) {
                endInnings();
                return;
            }
        }
    }
    
    updateScorecard();
}

// End innings
function endInnings() {
    isInningsOver = true;
    const resultText = document.getElementById("result-text");
    resultText.classList.remove("hidden");

    if (isFirstInnings) {
        // First innings ended, set target and switch roles
        isFirstInnings = false;
        if (isUserBatting) {
            target = userScore + 1;
            resultText.innerText = `${userTeam} scored ${userScore}. ${botTeam} needs ${target} to win.`;
            addCommentary(`That's the end of ${userTeam}'s innings! They've set a target of ${target} runs.`);
            isUserBatting = false;
        } else {
            target = botScore + 1;
            resultText.innerText = `${botTeam} scored ${botScore}. ${userTeam} needs ${target} to win.`;
            addCommentary(`That's the end of ${botTeam}'s innings! ${userTeam} needs ${target} runs to win.`);
            isUserBatting = true;
        }
        resultText.className = "bg-blue-600 p-4 rounded-lg shadow-lg mb-6 text-center text-xl font-bold";
        
        // Reset for second innings
        currentBatsmanIndex = 0;
        setTimeout(startInnings, 2000);
    } else {
        // Second innings ended - game over
        if (isUserBatting) {
            if (userScore >= target) {
                resultText.innerText = `${userTeam} wins by ${10 - userWickets} wickets!`;
                resultText.className = "bg-green-600 p-4 rounded-lg shadow-lg mb-6 text-center text-xl font-bold";
                addCommentary(`What a victory! ${userTeam} wins by ${10 - userWickets} wickets!`);
            } else {
                resultText.innerText = `${botTeam} wins by ${target - userScore - 1} runs!`;
                resultText.className = "bg-red-600 p-4 rounded-lg shadow-lg mb-6 text-center text-xl font-bold";
                addCommentary(`Heartbreak for ${userTeam}! ${botTeam} wins by ${target - userScore - 1} runs!`);
            }
        } else {
            if (botScore >= target) {
                resultText.innerText = `${botTeam} wins by ${10 - botWickets} wickets!`;
                resultText.className = "bg-red-600 p-4 rounded-lg shadow-lg mb-6 text-center text-xl font-bold";
                addCommentary(`Dominant performance! ${botTeam} wins by ${10 - botWickets} wickets!`);
            } else {
                resultText.innerText = `${userTeam} wins by ${target - botScore - 1} runs!`;
                resultText.className = "bg-green-600 p-4 rounded-lg shadow-lg mb-6 text-center text-xl font-bold";
                addCommentary(`Incredible! ${userTeam} wins by ${target - botScore - 1} runs!`);
            }
        }
    }
}
